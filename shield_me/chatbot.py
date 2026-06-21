import re
from predict import predict_email
from url_predict import predict_url
from gemini_service import generate_response

def is_url(text):
    return bool(re.search(r"(http[s]?://|www\.)", text))

def chat(message):
    analysis = predict_url(message) if is_url(message) else predict_email(message)

    prompt = f"""أنت خبير أمن سيبراني (Shield Me).
المدخل: "{message}"
التصنيف المحلي: {analysis}

أعطِ تحليلاً عربياً احترافياً ومختصراً بتنسيق Markdown:
1. **التقييم**: مباشر (آمن أم خطير).
2. **السبب**: شرح مبسط.
3. **التفاصيل**: قائمة بالعناصر المشبوهة.
4. **نصائح**: خطوات حماية سريعة.
"""
    return generate_response(prompt)
def casual_chat(message):
    prompt = f"""أنت مساعد أمان رقمي ودود اسمك "Shield Me".
رد على رسالة المستخدم بشكل طبيعي وودي باللغة العربية.
إذا كان السؤال عن الأمن الرقمي أجب عليه باختصار.
إذا كانت مجرد تحية أو محادثة عادية رد بشكل لطيف واذكر أنك هنا للمساعدة في فحص الروابط والملفات.
الرسالة: "{message}"
"""
    return generate_response(prompt)
