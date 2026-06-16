// 1. التنقل بين الصفحات
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function updateFileName() {
    const fileInput = document.getElementById('file-input');
    const attachLabel = document.getElementById('attach-label');
    
    // Check how many files are selected
    if (fileInput.files.length > 0) {
        // Show a folder icon and the number of files attached
        attachLabel.innerText = `📁 (${fileInput.files.length})`; 
        attachLabel.style.color = "#00e5ff"; 
    } else {
        attachLabel.innerText = "📎";
        attachLabel.style.color = "inherit";
    }
}
async function sendMessage() {
    const input = document.getElementById('user-input');
    const fileInput = document.getElementById('file-input');
    const btn = document.getElementById('send-btn');
    const loader = document.getElementById('loader');
    const chatBox = document.getElementById('chat-box');

    const message = input.value.trim();
    const files = fileInput.files; // Grab the whole list of files
    
    if (!message && files.length === 0) return;

    if (message) {
        chatBox.innerHTML += `<div class="message user-message">👤 ${message}</div>`;
    }
    
    // If files are attached, list all their names in the user message bubble
    if (files.length > 0) {
        let fileNames = [];
        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
        }
        chatBox.innerHTML += `<div class="message user-message">📁 فحص الملفات: <strong>${fileNames.join(', ')}</strong></div>`;
    }
    async function checkEmailFromFrontend(userEmailText) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: userEmailText }) // Sends the text to app.py
        });

        const result = await response.json();
        
        // This is the direct output from your joblib model!
        console.log("Prediction Result:", result); 
        
        // Example: Update your UI text with the result
        document.getElementById("result-box").innerText = `Result: ${result.prediction}`;

    } catch (error) {
        console.error("Could not connect to the Flask backend:", error);
    }
}
async function checkUrlFromFrontend(userUrl) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: userUrl })
        });

        const result = await response.json();
        console.log("URL Prediction Result:", result);
        
    } catch (error) {
        console.error("Error:", error);
    }
}

    chatBox.scrollTop = chatBox.scrollHeight;

    input.disabled = true;
    btn.disabled = true;
    fileInput.disabled = true;
    loader.style.display = "block";
    input.value = '';

    const formData = new FormData();
    if (message) formData.append('text', message);
    
    // Loop through the files and append EACH ONE to the formData
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/scan', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`Server status ${response.status}`);
        const data = await response.json();

        if (data.reply) {
            chatBox.innerHTML += `<div class="message bot-message">🤖 ${data.reply}</div>`;
        } else {
            chatBox.innerHTML += `<div class="message bot-message">🤖 استلمت طلبك ولكن الرد فارغ.</div>`;
        }

    } catch (error) {
        console.error("🚨 Connection Error:", error);
        chatBox.innerHTML += `<div class="message bot-message" style="color: #ff4b2b;">❌ فشل الاتصال بخادم الأمان.</div>`;
    } finally {
        input.disabled = false;
        btn.disabled = false;
        fileInput.disabled = false;
        loader.style.display = "none";
        fileInput.value = ''; 
        updateFileName(); // Reset the clip icon
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// 1. قاعدة بيانات الأسئلة (20 سؤال)
const allQuestions = [
    { q: "ما هو التصيد الاحتيالي (Phishing)؟", options: ["محاولة سرقة بياناتك عبر رسائل مزيفة", "تحديث نظام التشغيل", "نوع من أنواع الشاشات"], correct: 0 },
    { q: "أي من هذه الكلمات تعتبر كلمة مرور قوية؟", options: ["123456", "password", "A@7k9!pW2L"], correct: 2 },
    { q: "ماذا تفعل إذا وصلتك رسالة تخبرك بأنك ربحت مليون دولار وتطلب رقم حسابك؟", options: ["أرسل البيانات فوراً", "أتجاهل الرسالة وأحذفها", "أتصل بالرقم الموجود"], correct: 1 },
    { q: "ما فائدة الـ VPN؟", options: ["تسريع الألعاب فقط", "تشفير اتصالك بالإنترنت", "زيادة سعة الهارد ديسك"], correct: 1 },
    { q: "هل يجب تحديث البرامج بشكل دوري؟", options: ["نعم، لسد الثغرات الأمنية", "لا، لأنه يبطئ الجهاز", "فقط إذا تعطل البرنامج"], correct: 0 },
    // الإكمال إلى 20 سؤالاً:
    { q: "ما هي 'المصادقة الثنائية' (2FA)؟", options: ["إدخال كلمتي مرور مختلفتين", "خطوة تأكيد إضافية بجانب كلمة المرور", "استخدام جهازين للدخول للإنترنت"], correct: 1 },
    { q: "ما هو الإجراء الصحيح عند استخدام شبكة واي فاي عامة في مقهى؟", options: ["تجنب الدخول للحسابات البنكية", "تغيير كلمة مرور الجهاز فوراً", "مشاركة الملفات مع الآخرين"], correct: 0 },
    { q: "ما المقصود ببرمجيات الفدية (Ransomware)؟", options: ["برامج تسرع الجهاز", "برامج تشفر ملفاتك وتطلب مالاً لفكها", "برامج لحماية الصور"], correct: 1 },
    { q: "أي من الرموز التالية في رابط الموقع يدل على أن الاتصال آمن؟", options: ["http://", "ftp://", "https://"], correct: 2 },
    { q: "ما هي وظيفة 'جدار الحماية' (Firewall)؟", options: ["منع الوصول غير المصرح به للشبكة", "تنظيف الشاشة من الغبار", "تبريد المعالج"], correct: 0 },
    { q: "لماذا لا يجب استخدام نفس كلمة المرور لجميع حساباتك؟", options: ["لأنها ستكون صعبة التذكر", "لأنه إذا تم اختراق حساب واحد ستنكشف البقية", "لأن الموقع لا يسمح بذلك"], correct: 1 },
    { q: "ما هو 'الهندسة الاجتماعية' في الأمن السيبراني؟", options: ["بناء سيرفرات قوية", "التلاعب النفسي بالبشر لإفشاء أسرارهم", "تصميم واجهات المواقع"], correct: 1 },
    { q: "ماذا تفعل إذا اكتشفت أن جهازك مصاب بفيروس؟", options: ["إغلاقه للأبد", "عزله عن الشبكة واستخدام مكافح فيروسات", "زيادة إضاءة الشاشة"], correct: 1 },
    { q: "ما هو أفضل مكان للاحتفاظ بنسخة احتياطية من ملفاتك؟", options: ["على نفس قرص الويندوز", "في قرص خارجي أو سحابة آمنة", "داخل سلة المهملات"], correct: 1 },
    { q: "أي من هذه الممارسات تحميك من الفيروسات؟", options: ["تحميل البرامج من مصادر غير معروفة", "فتح الروابط العشوائية في الإيميل", "عدم تحميل الملفات المشبوهة"], correct: 2 },
    { q: "ما هي وظيفة مكافح الفيروسات (Antivirus)؟", options: ["اكتشاف وحذف البرمجيات الخبيثة", "زيادة سرعة الإنترنت", "تغيير خلفية سطح المكتب"], correct: 0 },
    { q: "ماذا يعني ظهور علامة 'القفل' بجانب رابط الموقع؟", options: ["الموقع مغلق للصيانة", "الاتصال بينك وبين الموقع مشفر", "الجهاز يحتاج لشحن"], correct: 1 },
    { q: "لماذا يجب الحذر من تطبيقات 'زيادة المتابعين' غير الرسمية؟", options: ["لأنها قد تسرق بيانات حسابك", "لأنها تأخذ مساحة كبيرة", "لأنها تجعل الهاتف يسخن"], correct: 0 },
    { q: "أي مما يلي يعد من المخاطر عند نشر معلوماتك الشخصية بكثرة؟", options: ["انتحال الشخصية", "تحسين جودة الصور", "زيادة عمر البطارية"], correct: 0 },
    { q: "ما هو التصرف الأمثل عند تلقي طلب صداقة من شخص مجهول تماماً؟", options: ["قبوله فوراً", "فحص الحساب والحذر أو تجاهله", "إرسال كلمة مروري له"], correct: 1 }
];

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// 2. دالة لبدء الكويز واختيار 5 أسئلة عشوائية
function startQuiz() {
    currentQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

// 3. عرض السؤال الحالي
function showQuestion() {
    const qData = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = qData.q;
    document.getElementById('question-number').innerText = `السؤال ${currentQuestionIndex + 1} من 5`;
    document.getElementById('progress').style.width = `${(currentQuestionIndex + 1) * 20}%`;
    document.getElementById('quiz-feedback').innerText = "";

    const container = document.getElementById('options-container');
    container.innerHTML = "";

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(index, btn);
        container.appendChild(btn);
    });
}

// 4. التحقق من الإجابة
function checkAnswer(selectedIndex, clickedBtn) {
    const correctIndex = currentQuestions[currentQuestionIndex].correct;
    const buttons = document.querySelectorAll('.option-btn');

    // تعطيل كل الأزرار بعد الاختيار
    buttons.forEach(btn => btn.disabled = true);

    if (selectedIndex === correctIndex) {
        clickedBtn.classList.add('correct');
        document.getElementById('quiz-feedback').innerText = "✅ إجابة صحيحة!";
        score++;
    } else {
        clickedBtn.classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        document.getElementById('quiz-feedback').innerText = "❌ إجابة خاطئة!";
    }

    // الانتقال للسؤال التالي بعد ثانية ونصف
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    document.getElementById('question-text').innerText = `انتهى الاختبار! نتيجتك هي ${score} من 5`;
    document.getElementById('options-container').innerHTML = `<button class="main-btn" onclick="startQuiz()">إعادة الاختبار</button>`;
}

// تعديل دالة showPage القديمة لتشغيل الكويز عند فتحه
const originalShowPage = showPage;
showPage = function (pageId) {
    originalShowPage(pageId);
    if (pageId === 'quiz') startQuiz();
}

// التبديل بين فورم الدخول والتسجيل
function toggleAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    }
}

// الدوال دي هنربطها بـ Firebase لاحقاً
function handleLogin() {
    console.log("محاولة دخول...");
    // هنا نضع كود Firebase Login
}

function handleRegister() {
    console.log("محاولة تسجيل جديد...");
    // هنا نضع كود Firebase Register
}

particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#00e5ff" }, /* لون النيون بتاعنا */
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": false },
        "size": { "value": 3, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#00e5ff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 2,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" }, /* بتربط مع الماوس */
            "onclick": { "enable": true, "mode": "push" }
        }
    },
    "retina_detect": true
}); function showPage(pageId) {
    const loader = document.getElementById('global-loader');
    const fill = document.getElementById('fill-bar');
    const pcCount = document.getElementById('pc-count');
    const lock = document.querySelector('.lock-icon');

    // تأكد إنها FLEX عشان التوسيط يشتغل
    loader.style.display = 'flex';

    let p = 0;
    lock.innerText = "🔒";

    let interval = setInterval(() => {
        p += Math.floor(Math.random() * 15) + 5;
        if (p >= 100) {
            p = 100;
            clearInterval(interval);
            lock.innerText = "🔓";

            setTimeout(() => {
                const pages = document.querySelectorAll('.page');
                pages.forEach(pg => pg.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');

                loader.style.display = 'none';
                fill.style.width = '0%';
                if (pageId === 'quiz') startQuiz();
            }, 500);
        }
        fill.style.width = p + '%';
        pcCount.innerText = p;
    }, 100);
}
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents adding an accidental new line or reloading the page
        sendMessage();          // Triggers your existing send function
    }
});