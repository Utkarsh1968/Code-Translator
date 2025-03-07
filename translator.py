from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import wandb
import autopep8  # Python formatting
import jsbeautifier  # JavaScript formatting
import subprocess  # For clang-format (C++) and Google Java Formatter (Java)
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import tempfile
import os
import re
from dotenv import load_dotenv  # Import dotenv to read .env file

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# ✅ Login to wandb
wandb.login(key=os.getenv("WANDB_API_KEY"))
wandb.init(project="codet5-finetuning", job_type= "download_artifact")  # Initialize wandb in disabled mode to avoid logging
#api = wandb.Api()

# ✅ Define available language models
model_artifacts = {
    "Python": "codet5-finetuning/codet5-python:latest",
    "C++": "codet5-finetuning/codet5-CPP:latest",
    "Java": "codet5-finetuning/codet5-Java:latest",
    "C#": "codet5-finetuning/codet5-CSharp:latest",
    "JavaScript": "codet5-finetuning/codet5-js:latest"
}

# ✅ Preload models asynchronously
models, tokenizers = {}, {}

def preload_models():
    for language in model_artifacts.keys():
        artifact = wandb.use_artifact(model_artifacts[language], type="model")
        artifact_dir = artifact.download()
        tokenizers[language] = AutoTokenizer.from_pretrained(artifact_dir)
        models[language] = AutoModelForSeq2SeqLM.from_pretrained(artifact_dir)
        models[language].eval()

preload_models()  
wandb.finish()  # Finish the wandb run after preloading models
wandb.init(mode="disabled")  # Reinitialize wandb in disabled mode to avoid logging
# Update this with the correct path to google-java-format.jar
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GOOGLE_JAVA_FORMAT_PATH = os.path.join(BASE_DIR, "google-java-format.jar")

def format_cpp_code(code):
    formatted_lines = []
    indent_level = 0
    indent_size = 4

    # Define patterns for indentation logic
    decrease_indent_pattern = re.compile(r'^\s*(\}|case |default:)')  # Matches '}' or 'case'/'default' in switch
    increase_indent_pattern = re.compile(r'(\{|\b(if|else|for|while|switch|do|try|catch|finally)\b(?!.*;))')  # Matches '{' or control statements

    for line in code.split("\n"):
        stripped = line.strip()

        # Decrease indent **before** writing the line (for closing braces and case/default)
        if decrease_indent_pattern.match(stripped):
            indent_level = max(0, indent_level - 1)

        formatted_lines.append(" " * (indent_level * indent_size) + stripped)

        # Increase indent **after** writing the line (for opening braces or control statements)
        if increase_indent_pattern.search(stripped):
            indent_level += 1

    return "\n".join(formatted_lines)

def format_csharp_code(code):
    formatted_lines = []
    indent_level = 0
    indent_size = 4

    for line in code.split("\n"):
        stripped = line.strip()

        # Decrease indent before adding the line if it starts with '}', 'case', or 'default'
        if stripped and (stripped.startswith("}") or stripped.startswith("case ") or stripped.startswith("default:")):
            indent_level = max(0, indent_level - 1)

        formatted_lines.append(" " * (indent_level * indent_size) + stripped)

        # Increase indent after lines ending with '{' or control statements that require a block
        if stripped.endswith("{") or (
            stripped and any(stripped.startswith(kw) for kw in ["if", "for", "while", "else", "switch", "do", "try", "catch", "finally"]) and not stripped.endswith(";")
        ):
            indent_level += 1

    return "\n".join(formatted_lines)


def format_code(code, language):
    if language == "Python":
        return autopep8.fix_code(code)
    elif language == "C++":
        return format_cpp_code(code)
    elif language == "C#":
        return format_csharp_code(code)
    elif language == "Java":
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".java", mode="w", encoding="utf-8") as temp_file:
                temp_file.write(code)
                temp_file.close()
                subprocess.run(["java", "-jar", GOOGLE_JAVA_FORMAT_PATH, "--replace", temp_file.name], check=True)
                with open(temp_file.name, "r", encoding="utf-8") as formatted_file:
                    formatted_code = formatted_file.read()
            os.remove(temp_file.name)
            return formatted_code if formatted_code.strip() else code
        except Exception as e:
            return code
    elif language == "JavaScript":
        options = jsbeautifier.default_options()
        options.indent_size = 4
        return jsbeautifier.beautify(code, options)
    return code

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    source_code = data.get('sourceCode')
    source_lang = data.get('sourceLanguage')
    target_lang = data.get('targetLanguage')
    if not all([source_code, source_lang, target_lang]):
        return jsonify({'error': 'Missing required parameters'}), 400
    if source_lang == target_lang:
        return jsonify({'error': 'Source and target languages must be different'}), 400
    if source_lang not in models or target_lang not in models:
        return jsonify({'error': 'Unsupported programming language'}), 400
    try:
        input_text = f"<{source_lang}> {source_code} <to> <{target_lang}>"
        tokenizer = tokenizers[source_lang]
        model = models[source_lang]
        inputs = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512, num_beams=5)
        translated_code = tokenizer.decode(outputs[0], skip_special_tokens=True)
        formatted_code = format_code(translated_code, target_lang)
        return jsonify({'translatedCode': formatted_code})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
