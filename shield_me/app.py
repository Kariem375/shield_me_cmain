from flask import Flask, request, jsonify
from flask_cors import CORS
import yara

app = Flask(__name__)
# This allows your frontend (HTML/JS) to talk to your backend safely
CORS(app) 

# Load your YARA rules when the server starts
try:
    rules = yara.compile(filepath='rules.yar')
    print("✅ YARA rules loaded successfully!")
except Exception as e:
    print(f"❌ Error loading YARA rules: {e}")
    rules = None

@app.route('/scan', methods=['POST'])
def scan():
    user_text = request.form.get('text', '')
    uploaded_files = request.files.getlist('file') 

    reply_message = ""

    # The translation dictionary mapped to Arabic
    threat_descriptions = {
        "Test_Malware_Rule": "تم اكتشاف ملف اختبار. محرك الحماية يعمل بكفاءة.",
        "Suspicious_PDF_With_JS": "ملف PDF خبيث! يحتوي على أكواد جافا سكريبت مخفية للعمل تلقائياً.",
        "Suspicious_PDF_External_Launch": "ملف PDF خطير! يحاول تشغيل أوامر وبرامج خارجية على جهازك.",
        "Malicious_Office_Macro": "مستند أوفيس مصاب! يحتوي على وحدات ماكرو مشبوهة تستخدم لتحميل الفيروسات.",
        "PHP_WebShell_Commands": "سكربت اختراق (Web Shell)! يسمح للمخترقين بالتحكم في الخادم.",
        "ASP_WebShell_Uploader": "أداة رفع ملفات خبيثة! تستخدم لرفع الفيروسات إلى الخوادم.",
        "Ransomware_ShadowCopy_Deletion": "سلوك فيروس فدية! يحاول حذف النسخ الاحتياطية لنظام الويندوز.",
        "Windows_Keylogger_API": "برمجية تجسس! تحتوي على أكواد مصممة لتسجيل ما تكتبه على لوحة المفاتيح.",
        "Suspicious_Memory_Injection": "حصان طروادة (Trojan)! يحاول حقن أكواد خبيثة داخل عمليات النظام الآمنة.",
        "InfoStealer_Browser_Data": "برمجية سرقة بيانات! تحاول سرقة كلمات المرور المحفوظة من متصفحك.",
        "Hidden_PowerShell_Execution": "سكربت خبيث! يحاول تشغيل أوامر مخفية للتحكم في النظام."
    }

    if user_text:
        try:
            ai_response = ""  # ← empty for now, will add model later
        
            if not ai_response:
                reply_message += "⚠️ لم يتم الحصول على رد من النموذج، حاول مرة أخرى."
            else:
                reply_message += ai_response
            
        except Exception as e:
            reply_message += f"❌ حدث خطأ أثناء الاتصال بالنموذج: {str(e)}"

    if uploaded_files and rules:
        for uploaded_file in uploaded_files:
            if uploaded_file.filename == '':
                continue
                
            file_content = uploaded_file.read()
            matches = rules.match(data=file_content)
            
            if matches:
                reply_message += f"<br><span style='color: #ff4b2b;'>⚠️ <strong>تم اكتشاف تهديد في [{uploaded_file.filename}]</strong></span>:<br>"
                
                for match in matches:
                    description = threat_descriptions.get(match.rule, f"توقيع برمجي غير معروف ({match.rule})")
                    reply_message += f"&nbsp;&nbsp;➔ {description}<br>"
            else:
                reply_message += f"<br>📁 الملف [{uploaded_file.filename}] نظيف وآمن تماماً."
                
    elif uploaded_files and not rules:
        reply_message += "<br>⚠️ تم استلام الملفات لكن محرك الفحص غير مفعل."

    if not user_text and not uploaded_files:
        reply_message = "لم يتم إرسال أي بيانات أو ملفات للفحص."

    return jsonify({"reply": reply_message})

if __name__ == '__main__':
    # Start the local server
    app.run(debug=True, port=5000)