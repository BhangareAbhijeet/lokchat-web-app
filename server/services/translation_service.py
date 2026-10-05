# # translate.py
# import sys
# import json
# from googletrans import Translator

# def main():
#     try:
#         input_data = json.loads(sys.stdin.read())
#         text = input_data.get("text")
#         source = input_data.get("source")
#         target = input_data.get("target")

#         translator = Translator()
#         translated = translator.translate(text, src=source, dest=target)

#         print(json.dumps({"translated": translated.text}))
#     except Exception as e:
#         print(json.dumps({"error": str(e)}))

# if __name__ == "__main__":
#     main()


# translate.py
import sys
import io
import json
from deep_translator import GoogleTranslator

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        text = input_data.get("text")
        target = input_data.get("target")

        if not text or not target:
            print(json.dumps({"error": "Missing 'text' or 'target'"}))
            return

        # Clean text to avoid surrogate errors
        text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

        translated = GoogleTranslator(target=target).translate(text)

        print(json.dumps({"translated": translated}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
