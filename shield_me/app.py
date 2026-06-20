from flask import Flask, request, jsonify
from flask_cors import CORS
import yara
import joblib
import os
import pandas as pd
from predict import predict_email
from url_predict import predict_url as url_predictor
from chatbot import chat as gemini_chat
import markdown

app = Flask(__name__)
CORS(app)  # Allows your script.js frontend to communicate safely

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==========================================
# 1. LOAD YARA RULES (FOR FILE SCANNING)
# ==========================================
try:
    rules = yara.compile(filepath=os.path.join(BASE_DIR, 'rules.yar'))
    print("✅ YARA rules loaded successfully!")
except Exception as e:
    print(f"❌ Error loading YARA rules: {e}")
    rules = None

# Threat dictionary mapping for YARA rules
threat_descriptions = {
    "Test_Malware_Rule": "تم اكتشاف ملف اختبار. محرك الحماية يعمل بكفاءة.",
    "Suspicious_PDF_With_JS": "ملف PDF خبيث! يحتوي على أكواد جافا سكريبت مخفية للعمل تلقائياً.",
    "Suspicious_PDF_External_Launch": "ملف PDF خطير! يحاول تشغيل أوامر وبرامج خارجية على جهازك.",
    "Malicious_Office_Macro": "مستند أوفيس مصاب! يحتوي على وحدات ماكرو مشبوهة تستخدم لتحميل الفيروسات.",
    "PHP_WebShell_Commands": "سكربت اختراق (Web Shell)! يسمح للمخترق بالتحكم في الموقع.",
    "Suspicious_Memory_Injection": "تم اكتشاف سلوك خبيث يحاول حتم أودام في برامج أخرى آمنة.",
    "InfoStealer_Browser_Data": "تم اكتشاف برمجية خبيثة تحاول سرقة بيانات الحسابات وكلمات المرور المخزنة في المتصفح.",
    "Hidden_PowerShell_Execution": "ملف سكربت خطير يحاول تشغيل أوامر PowerShell مخفية لتخطي الحماية."
}

# ==========================================
# 2. LOAD LOCAL ML MODELS (FOR EMAIL & URL)
# ==========================================
try:
    email_model = joblib.load(os.path.join(BASE_DIR, 'model (1).pkl'))
    vectorizer = joblib.load(os.path.join(BASE_DIR, 'vectorizer (1).pkl'))
    url_model = joblib.load(os.path.join(BASE_DIR, 'url_model.pkl'))
    url_columns = joblib.load(os.path.join(BASE_DIR, 'url_columns.pkl'))
    print("✅ Machine Learning models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading ML models: {e}")

# ==========================================
# 3. UNIFIED SCAN ROUTE
# ==========================================

@app.route('/scan', methods=['POST'])
def scan():
    user_text = request.form.get('text', '').strip()
    uploaded_files = request.files.getlist('file') 

    reply_message = ""

# PART A: Check text inputs (URLs or Email Text) using local ML Models
    if user_text:
        if user_text.startswith(('http://', 'https://')) or 'www.' in user_text:
            url_res = url_predictor(user_text)
            reply_message += f"🌐 <strong>تحليل الرابط الإلكتروني ({user_text}):</strong><br>"
            if url_res['classification'] == 'Unsafe':
                risk = "عالي جداً" if url_res['risk_level'] == 'High' else url_res['risk_level']
                reply_message += f"<span style='color: #ff4b2b;'>⚠️ تم تصنيفه كـ غيـر آمـن (مستوى الخطورة: {risk})</span><br><br>"
            else:
                reply_message += f"<span style='color: #00e5ff;'>✅ الرابط نظيف وآمن تماماً للاستخدام.</span><br><br>"
        else:
            email_res = predict_email(user_text)
            reply_message += f"📧 <strong>تحليل محتوى النص / البريد الإلكتروني:</strong><br>"
            if email_res['classification'] == 'Spam':
                risk = "عالي" if email_res['risk_level'] == 'High' else email_res['risk_level']
                reply_message += f"<span style='color: #ff4b2b;'>⚠️ تم تصنيفه كـ بريد احتيالي / مزعج (مستوى الخطورة: {risk})</span><br><br>"
            else:
                reply_message += f"<span style='color: #00e5ff;'>✅ محتوى النص يبدو آمناً ولا توجد به مؤشرات احتيال قوية.</span><br><br>"

        # ==========================================
        # 🤖 GEMINI AI INTEGRATION (ARABIC OUTPUT)
        # ==========================================
        ai_response = gemini_chat(user_text)
        html_ai_response = markdown.markdown(ai_response)
        
        reply_message += f"""
        <div style="background-color: rgba(255, 255, 255, 0.04); padding: 18px; border-radius: 8px; margin-top: 15px; border-right: 4px solid #00e5ff; text-align: right; direction: rtl; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <div style="color: #00e5ff; font-weight: bold; margin-bottom: 12px; font-size: 1.15em;">
                🤖 تحليل مستشار الذكاء الاصطناعي (Shield Me AI):
            </div>
            <div style='color: #e3e3e3; font-size: 14.5px; line-height: 1.8;'>
                {html_ai_response}
            </div>
        </div><br>
        """

    # PART B: Check uploaded files using YARA Engine
    if uploaded_files and rules:
        has_valid_files = False
        for uploaded_file in uploaded_files:
            if uploaded_file.filename == '':
                continue
            
            if not has_valid_files:
                reply_message += "📁 <strong>File Upload Scan Results:</strong><br>"
                has_valid_files = True

            file_content = uploaded_file.read()
            matches = rules.match(data=file_content)
            
            if matches:
                reply_message += f"<span style='color: #ff4b2b;'>⚠️ <strong>Threat found in [{uploaded_file.filename}]</strong></span>:<br>"
                for match in matches:
                    description = threat_descriptions.get(match.rule, f"توقيع برمجي غير معروف ({match.rule})")
                    reply_message += f"&nbsp;&nbsp;➔ {description}<br>"
            else:
                reply_message += f"✅ File [{uploaded_file.filename}] is clean.<br>"
                
    elif uploaded_files and not rules:
        reply_message += "⚠️ Files received but YARA scanner engine is offline.<br>"

    # Fallback if everything was empty
    if not user_text and not uploaded_files:
        reply_message = "No data or files were sent for scanning."

    return jsonify({"reply": reply_message})


# Standalone endpoints kept intact for fallback direct API calls
@app.route('/predict_email', methods=['POST'])
def email_route():
    data = request.get_json()
    text = data.get('text', '')
    result = predict_email(text)
    return jsonify(result)


@app.route('/predict_url', methods=['POST'])
def url_route():
    data = request.get_json()
    url = data.get('url', '')
    result = url_predictor(url)
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=5000)