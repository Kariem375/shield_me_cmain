'use strict';

const API_BASE_URL = (window.SHIELDME_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const FRONTEND_ONLY_MODE = window.SHIELDME_FRONTEND_ONLY === true;
let loaderInterval = null;

function $(id) {
    return document.getElementById(id);
}

function closeMobileMenu() {
    const nav = $('nav-links');
    if (nav) nav.classList.remove('open');
}

function toggleMobileMenu() {
    const nav = $('nav-links');
    if (nav) nav.classList.toggle('open');
}

function activatePage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const target = $(pageId);
    if (target) target.classList.add('active');
    closeMobileMenu();

    if (pageId === 'quiz') startQuiz();
    if (pageId === 'history') renderHistory();
}

function showPage(pageId) {
    const loader = $('global-loader');
    const fill = $('fill-bar');
    const pcCount = $('pc-count');
    const lock = document.querySelector('.lock-icon');

    if (!loader || !fill || !pcCount || !lock) {
        activatePage(pageId);
        return;
    }

    clearInterval(loaderInterval);
    loader.style.display = 'flex';
    fill.style.width = '0%';
    pcCount.textContent = '0';
    lock.textContent = '🔒';

    let progress = 0;
    loaderInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 14) + 7;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loaderInterval);
            lock.textContent = '🔓';
            setTimeout(() => {
                loader.style.display = 'none';
                fill.style.width = '0%';
                pcCount.textContent = '0';
                activatePage(pageId);
            }, 350);
        }
        fill.style.width = `${progress}%`;
        pcCount.textContent = String(progress);
    }, 70);
}

function updateFileName() {
    const fileInput = $('file-input');
    const attachCount = $('attach-count');
    const hint = $('file-hint');
    const count = fileInput?.files?.length || 0;

    if (attachCount) {
        attachCount.hidden = count === 0;
        attachCount.textContent = String(count);
    }

    if (hint) {
        if (count === 0) {
            hint.textContent = 'لا توجد ملفات مرفقة';
        } else if (count === 1) {
            hint.textContent = `ملف مرفق: ${fileInput.files[0].name}`;
        } else {
            hint.textContent = `${count} ملفات مرفقة`;
        }
    }
}

function appendMessage(text, className, options = {}) {
    const chatBox = $('chat-box');
    if (!chatBox) return null;

    const div = document.createElement('div');
    div.className = className;

    if (options.html) {
        div.innerHTML = sanitizeHtml(text);
    } else {
        div.textContent = text;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');

    const allowedTags = new Set(['BR', 'STRONG', 'B', 'EM', 'I', 'SPAN', 'DIV', 'P', 'UL', 'OL', 'LI']);
    const allowedStyleProps = new Set([
        'color', 'background-color', 'padding', 'border-radius', 'margin-top', 'margin-bottom',
        'border-right', 'text-align', 'direction', 'line-height', 'font-weight', 'font-size',
        'box-shadow', 'background'
    ]);

    const cleanNode = (node) => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowedTags.has(child.tagName)) {
                    child.replaceWith(document.createTextNode(child.textContent || ''));
                    return;
                }

                [...child.attributes].forEach(attr => {
                    const name = attr.name.toLowerCase();
                    const value = attr.value || '';

                    if (name.startsWith('on')) {
                        child.removeAttribute(attr.name);
                        return;
                    }

                    if (name === 'style') {
                        const safeStyles = value.split(';').map(rule => rule.trim()).filter(Boolean).filter(rule => {
                            const prop = rule.split(':')[0]?.trim().toLowerCase();
                            return allowedStyleProps.has(prop) && !/url\s*\(|javascript:/i.test(rule);
                        });
                        if (safeStyles.length) child.setAttribute('style', safeStyles.join('; '));
                        else child.removeAttribute('style');
                        return;
                    }

                    child.removeAttribute(attr.name);
                });

                cleanNode(child);
            } else if (child.nodeType === Node.COMMENT_NODE) {
                child.remove();
            }
        });
    };

    cleanNode(template.content);
    return template.innerHTML;
}

function isCasualMessage(text) {
    const msg = text.trim().toLowerCase();
    if (!msg) return false;

    const scanHints = /(https?:\/\/|www\.|افحص|حلل|scan|check|لينك|رابط|url|ملف|file|email|بريد|رسالة مشبوهة)/i;
    if (scanHints.test(msg)) return false;

    const casualPatterns = [
        /^(هلا|هاي|hi|hello|اهلا|أهلا|السلام عليكم|ازيك|إزيك|عامل ايه|ايه الاخبار|إيه الأخبار|شكرا|شكرًا|تمام|صباح الخير|مساء الخير)\b/i,
        /^(مين انت|انت بتعمل ايه|تعمل ايه|ما وظيفتك|what can you do)/i
    ];
    return casualPatterns.some(pattern => pattern.test(msg)) || msg.length <= 18;
}

function getLocalChatReply(text) {
    const msg = text.trim().toLowerCase();
    if (/السلام عليكم/.test(msg)) return 'وعليكم السلام ورحمة الله وبركاته 👋 كيف أقدر أساعدك اليوم؟';
    if (/(هلا|هاي|hi|hello|اهلا|أهلا|ازيك|إزيك)/i.test(msg)) return 'أهلاً بيك 👋 أنا Shield Me. تقدر تبعتلي رابط أو ملف للفحص، أو تسألني عن نصائح الأمان الرقمي.';
    if (/(شكرا|شكرًا|تمام)/i.test(msg)) return 'العفو 🌟 أي وقت تحتاج تفحص رابط أو ملف، ابعته هنا.';
    if (/(تعمل ايه|بتعمل ايه|وظيفتك|مين انت)/i.test(msg)) return 'أنا مساعد أمان رقمي. أساعدك في فحص الروابط والملفات، وأشرح لك مؤشرات الاحتيال بطريقة بسيطة.';
    return 'أنا معاك 👋 ابعت رابط/ملف للفحص أو اسألني عن أي نصيحة تخص الأمان الرقمي.';
}


function hasScanIntent(text, files) {
    if ((files?.length || 0) > 0) return true;
    const msg = String(text || '').trim();
    return /(https?:\/\/|www\.|افحص|فحص|حلل|scan|check|لينك|رابط|url|ملف|file|email|بريد|رسالة مشبوهة)/i.test(msg);
}

function buildFrontendOnlyScanMessage(message, files) {
    const names = Array.from(files || []).map(file => file.name).join('، ');
    const hasUrl = /(https?:\/\/|www\.)/i.test(message || '');
    const subject = names || (hasUrl ? 'الرابط المرسل' : 'النص المرسل');
    return [
        'وضع الواجهة فقط مفعل حاليًا. ✅',
        `تم استقبال ${subject} بنجاح من ناحية الواجهة، لكن الفحص الحقيقي يحتاج تشغيل الباك إند.`,
        'لتجربة الفحص الحقيقي شغّل app.py، ثم غيّر window.SHIELDME_FRONTEND_ONLY إلى false في index.html.'
    ].join('<br>');
}

async function sendMessage(event) {
    if (event) event.preventDefault();

    const input = $('user-input');
    const fileInput = $('file-input');
    const btn = $('send-btn');
    const loader = $('loader');

    const message = input.value.trim();
    const files = fileInput.files;

    if (!message && files.length === 0) return;

    if (message) appendMessage(`${message}👤`, 'message user-message');

    if (files.length > 0) {
        const fileNames = Array.from(files).map(file => file.name).join('، ');
        appendMessage(`📁 فحص الملفات: ${fileNames}`, 'message user-message');
    }

    input.value = '';

    if (files.length === 0 && message && isCasualMessage(message)) {
        if (FRONTEND_ONLY_MODE) {
           appendMessage(`🤖 ${getLocalChatReply(message)}`, 'message bot-message');
           saveHistory({ type: 'chat', input: message, result: 'محادثة عادية' });
           return;
        }
        setFormLoading(true, input, btn, fileInput, loader);
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            appendMessage(`🤖 ${data.reply}`, 'message bot-message');
         saveHistory({ type: 'chat', input: message, result: data.reply.slice(0, 120) });
        } catch {
            appendMessage(`🤖 ${getLocalChatReply(message)}`, 'message bot-message');
        } finally {
            setFormLoading(false, input, btn, fileInput, loader);
        }
        return;
    }

    if (FRONTEND_ONLY_MODE) {
        const reply = buildFrontendOnlyScanMessage(message, files);
        appendMessage(`🤖 ${reply}`, 'message bot-message', { html: true });
        saveHistory({
            type: files.length ? 'file' : 'text',
            input: files.length ? Array.from(files).map(file => file.name).join('، ') : message,
            result: 'طلب فحص - وضع الواجهة فقط'
        });
        fileInput.value = '';
        updateFileName();
        return;
    }

    const formData = new FormData();
    if (message) formData.append('text', message);
    Array.from(files).forEach(file => formData.append('file', file));

    setFormLoading(true, input, btn, fileInput, loader);

    try {
        const response = await fetch(`${API_BASE_URL}/scan`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`Server status ${response.status}`);
        const data = await response.json();

        if (data.reply) {
            appendMessage(`🤖 ${data.reply}`, 'message bot-message', { html: true });
            saveHistory({
                type: files.length ? 'file' : 'text',
                input: files.length ? Array.from(files).map(file => file.name).join('، ') : message,
                result: stripHtml(data.reply).slice(0, 260)
            });
        } else {
            appendMessage('🤖 تم استلام الطلب، لكن لم يتم إرسال نتيجة واضحة.', 'message bot-message');
        }
    } catch (error) {
        console.warn('Backend connection unavailable:', error?.message || error);
        appendMessage('❌ خدمة الفحص غير متصلة حاليًا. شغّل الباك إند على المنفذ 5000 أو فعّل وضع الواجهة فقط من index.html.', 'message bot-message error-message');
    } finally {
        setFormLoading(false, input, btn, fileInput, loader);
        fileInput.value = '';
        updateFileName();
    }
}

function setFormLoading(isLoading, input, btn, fileInput, loader) {
    input.disabled = isLoading;
    btn.disabled = isLoading;
    fileInput.disabled = isLoading;
    loader.style.display = isLoading ? 'block' : 'none';
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = sanitizeHtml(html);
    return tmp.textContent || tmp.innerText || '';
}

function getHistoryKey() {
    const user = window.currentShieldUser;
    return user?.uid ? `shieldme_history_${user.uid}` : null;
}

function saveHistory(item) {
    const key = getHistoryKey();
    if (!key) return;

    const records = JSON.parse(localStorage.getItem(key) || '[]');
    records.unshift({
        ...item,
        time: new Date().toLocaleString('ar-EG')
    });
    localStorage.setItem(key, JSON.stringify(records.slice(0, 25)));
}

function renderHistory() {
    const list = $('history-list');
    const locked = $('history-locked');
    if (!list || !locked) return;

    const key = getHistoryKey();
    if (!key) {
        list.innerHTML = '';
        locked.hidden = false;
        return;
    }

    locked.hidden = true;
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    if (!records.length) {
        list.innerHTML = '<div class="empty-history">لا يوجد سجل فحص حتى الآن.</div>';
        return;
    }

    list.innerHTML = '';
    records.forEach(record => {
        const card = document.createElement('div');
        card.className = 'history-card';

        const title = document.createElement('h3');
        title.textContent = record.type === 'file' ? '📁 فحص ملف' : record.type === 'chat' ? '💬 محادثة' : '🔍 فحص نص/رابط';

        const input = document.createElement('p');
        input.textContent = record.input;

        const result = document.createElement('small');
        result.textContent = record.result;

        const time = document.createElement('span');
        time.className = 'history-time';
        time.textContent = record.time;

        card.append(title, input, result, time);
        list.appendChild(card);
    });
}

function clearHistory() {
    const key = getHistoryKey();
    if (!key) {
        if (window.showToast) window.showToast('سجل الفحص الشخصي يحتاج تسجيل الدخول باستخدام Google أولاً.', 'warning', 5000);
        showPage('login');
        return;
    }
    localStorage.removeItem(key);
    renderHistory();
    if (window.showToast) window.showToast('تم مسح سجل الفحص.');
}

window.addEventListener('shield-auth-changed', () => {
    if ($('history')?.classList.contains('active')) renderHistory();
});

// Quiz
const allQuestions = [
    { q: 'ما هو التصيد الاحتيالي (Phishing)؟', options: ['محاولة سرقة بياناتك عبر رسائل مزيفة', 'تحديث نظام التشغيل', 'نوع من أنواع الشاشات'], correct: 0, explanation: 'التصيد الاحتيالي هو أسلوب هجوم يعتمد على رسائل مزيفة تنتحل صفة جهات موثوقة بهدف سرقة كلمات المرور أو البيانات البنكية.' },
    { q: 'أي من هذه الكلمات تعتبر كلمة مرور قوية؟', options: ['123456', 'password', 'A@7k9!pW2L'], correct: 2, explanation: 'كلمة المرور القوية تجمع بين أحرف كبيرة وصغيرة وأرقام ورموز، ولا تكون كلمة قاموسية أو تسلسلاً رقمياً سهل التخمين.' },
    { q: 'ماذا تفعل إذا وصلتك رسالة تخبرك بأنك ربحت مليون دولار وتطلب رقم حسابك؟', options: ['أرسل البيانات فوراً', 'أتجاهل الرسالة وأحذفها', 'أتصل بالرقم الموجود'], correct: 1, explanation: 'هذا النوع من الرسائل هو احتيال جائزة كلاسيكي. لا توجد جائزة حقيقية، والهدف هو سرقة بياناتك البنكية أو ابتزازك.' },
    { q: 'ما فائدة الـ VPN؟', options: ['تسريع الألعاب فقط', 'تشفير اتصالك بالإنترنت', 'زيادة سعة الهارد ديسك'], correct: 1, explanation: 'الـ VPN يُنشئ نفقاً مشفراً لبياناتك على الإنترنت، مما يحمي اتصالك من التجسس خاصةً على الشبكات العامة.' },
    { q: 'هل يجب تحديث البرامج بشكل دوري؟', options: ['نعم، لسد الثغرات الأمنية', 'لا، لأنه يبطئ الجهاز', 'فقط إذا تعطل البرنامج'], correct: 0, explanation: 'التحديثات تحتوي في الغالب على إصلاحات لثغرات أمنية مكتشفة حديثاً. تأخير التحديث يترك بابك مفتوحاً للمخترقين.' },
    { q: 'ما هي المصادقة الثنائية (2FA)؟', options: ['إدخال كلمتي مرور مختلفتين', 'خطوة تأكيد إضافية بجانب كلمة المرور', 'استخدام جهازين للدخول للإنترنت'], correct: 1, explanation: 'الـ 2FA تضيف طبقة حماية ثانية مثل كود SMS أو تطبيق مصادقة، حتى لو سُرقت كلمة مرورك لن يتمكن أحد من الدخول بدونها.' },
    { q: 'ما هو الإجراء الصحيح عند استخدام شبكة واي فاي عامة؟', options: ['تجنب الدخول للحسابات البنكية', 'تغيير كلمة مرور الجهاز فوراً', 'مشاركة الملفات مع الآخرين'], correct: 0, explanation: 'الشبكات العامة غير مشفرة وأي شخص على نفس الشبكة قد يستطيع اعتراض بياناتك. تجنب أي عمليات حساسة عليها.' },
    { q: 'ما المقصود ببرمجيات الفدية؟', options: ['برامج تسرع الجهاز', 'برامج تشفر ملفاتك وتطلب مالاً لفكها', 'برامج لحماية الصور'], correct: 1, explanation: 'برمجيات الفدية (Ransomware) تقوم بتشفير ملفاتك وتطلب دفع مبلغ مالي للحصول على مفتاح فك التشفير، وكثيراً ما يختفي المهاجم بعد الدفع.' },
    { q: 'أي رمز في رابط الموقع يدل على اتصال أكثر أماناً؟', options: ['http://', 'ftp://', 'https://'], correct: 2, explanation: 'الـ HTTPS يعني أن الاتصال مشفر بين متصفحك والخادم. الـ HTTP يرسل البيانات نصاً صريحاً قابلاً للاعتراض.' },
    { q: 'ما وظيفة جدار الحماية؟', options: ['منع الوصول غير المصرح به للشبكة', 'تنظيف الشاشة من الغبار', 'تبريد المعالج'], correct: 0, explanation: 'جدار الحماية (Firewall) يراقب ويتحكم في حركة البيانات الواردة والصادرة ويحجب الاتصالات المشبوهة.' },
    { q: 'لماذا لا تستخدم نفس كلمة المرور لكل الحسابات؟', options: ['لأنها صعبة التذكر', 'لأن اختراق حساب واحد قد يكشف الباقي', 'لأن كل المواقع تمنع ذلك'], correct: 1, explanation: 'إذا اخترق أحدهم موقعاً واحداً وحصل على كلمة مرورك، سيجرب نفسها على بريدك وحساباتك البنكية فوراً.' },
    { q: 'ما هي الهندسة الاجتماعية؟', options: ['بناء سيرفرات قوية', 'التلاعب بالبشر لإفشاء معلومات حساسة', 'تصميم واجهات المواقع'], correct: 1, explanation: 'الهندسة الاجتماعية تستغل علم النفس البشري لا الثغرات التقنية. المهاجم يتظاهر بأنه شخص موثوق لخداعك لتسليم معلوماتك طوعاً.' },
    { q: 'ماذا تفعل لو جهازك مصاب بفيروس؟', options: ['تغلقه للأبد', 'تعزله عن الشبكة وتستخدم مكافح فيروسات', 'تزود إضاءة الشاشة'], correct: 1, explanation: 'العزل عن الشبكة يمنع الفيروس من الانتشار أو إرسال بياناتك، ثم يمكن استخدام مكافح الفيروسات بأمان لإزالته.' },
    { q: 'أفضل مكان لنسخة احتياطية مهمة؟', options: ['على نفس قرص النظام فقط', 'قرص خارجي أو سحابة آمنة', 'داخل سلة المهملات'], correct: 1, explanation: 'قاعدة 3-2-1: 3 نسخ، على وسيطين مختلفين، واحدة خارج المكان. إذا أصاب الفيروس جهازك ستفقد نسختك المحلية معه.' },
    { q: 'أي ممارسة تحميك من الفيروسات؟', options: ['تحميل برامج مجهولة', 'فتح روابط عشوائية', 'عدم تحميل ملفات مشبوهة'], correct: 2, explanation: 'معظم الإصابات تحدث عن طريق تحميل ملفات من مصادر غير موثوقة. تحميل البرامج من المصادر الرسمية فقط يقلل الخطر بشكل كبير.' },
    { q: 'وظيفة مكافح الفيروسات؟', options: ['اكتشاف وحذف البرمجيات الخبيثة', 'زيادة سرعة الإنترنت', 'تغيير الخلفية'], correct: 0, explanation: 'مكافح الفيروسات يفحص الملفات والعمليات باستمرار بحثاً عن أنماط برمجيات خبيثة معروفة ويعزلها أو يحذفها.' },
    { q: 'ماذا تعني علامة القفل بجانب الرابط؟', options: ['الموقع مغلق', 'الاتصال مشفر', 'الجهاز يحتاج شحن'], correct: 1, explanation: 'القفل يعني أن الموقع يستخدم HTTPS وأن البيانات المنقولة بينك وبينه مشفرة ولا يمكن اعتراضها بسهولة.' },
    { q: 'لماذا نحذر من تطبيقات زيادة المتابعين؟', options: ['قد تسرق بيانات الحساب', 'تأخذ مساحة فقط', 'تجعل الهاتف يسخن'], correct: 0, explanation: 'هذه التطبيقات في الغالب تطلب صلاحيات الحساب أو كلمة المرور، وتستخدمها لاختراق حسابك أو بيع بياناتك.' },
    { q: 'خطر نشر معلوماتك الشخصية بكثرة؟', options: ['انتحال الشخصية', 'تحسين جودة الصور', 'زيادة عمر البطارية'], correct: 0, explanation: 'المعلومات الشخصية المتاحة علناً تُمكّن المهاجمين من انتحال هويتك، أو الإجابة على أسئلة الأمان، أو استهدافك بهجمات مخصصة.' },
    { q: 'طلب صداقة من شخص مجهول تماماً؟', options: ['قبوله فوراً', 'فحص الحساب أو تجاهله', 'إرسال كلمة المرور له'], correct: 1, explanation: 'الحسابات المزيفة تُستخدم لجمع معلوماتك الشخصية أو إرسال روابط خبيثة لك لاحقاً. دائماً تحقق من هوية من يتواصل معك.' }
];

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

function startQuiz() {
    currentQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    const qData = currentQuestions[currentQuestionIndex];
    if (!qData) return;

    $('question-text').textContent = qData.q;
    $('question-number').textContent = `السؤال ${currentQuestionIndex + 1} من 5`;
    $('progress').style.width = `${(currentQuestionIndex + 1) * 20}%`;
    $('quiz-feedback').textContent = '';

    const container = $('options-container');
    container.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(index, btn);
        container.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, clickedBtn) {
    const correctIndex = currentQuestions[currentQuestionIndex].correct;
    const explanation = currentQuestions[currentQuestionIndex].explanation;
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    if (selectedIndex === correctIndex) {
        clickedBtn.classList.add('correct');
        $('quiz-feedback').innerHTML = `✅ إجابة صحيحة!<br><small style="color:#aaa;line-height:1.6;">${explanation}</small>`;
        score++;
    } else {
        clickedBtn.classList.add('wrong');
        buttons[correctIndex]?.classList.add('correct');
        $('quiz-feedback').innerHTML = `❌ إجابة خاطئة!<br><small style="color:#aaa;line-height:1.6;">${explanation}</small>`;
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'main-btn';
    nextBtn.style.cssText = 'margin-top:14px;padding:10px 28px;font-size:15px;';
    nextBtn.textContent = currentQuestionIndex + 1 < 5 ? 'التالي ←' : 'إنهاء الاختبار';
    nextBtn.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) showQuestion();
        else finishQuiz();
    };
    $('options-container').appendChild(nextBtn);
}

function finishQuiz() {
    $('question-text').textContent = `انتهى الاختبار! نتيجتك هي ${score} من 5`;
    const container = $('options-container');
    container.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'main-btn';
    btn.textContent = 'إعادة الاختبار';
    btn.onclick = startQuiz;
    container.appendChild(btn);
}

function toggleAuth() {
    // التسجيل العادي تم إلغاؤه. الدخول متاح باستخدام Google فقط.
    if (window.showToast) window.showToast('التسجيل متاح باستخدام Google فقط.', 'info', 4000);
    showPage('login');
}

function initParticles() {
    if (typeof particlesJS !== 'function') return;
    const isSmall = window.innerWidth < 600;
    particlesJS('particles-js', {
        particles: {
            number: { value: isSmall ? 35 : 75, density: { enable: true, value_area: 800 } },
            color: { value: '#00e5ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.45, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#00e5ff', opacity: 0.35, width: 1 },
            move: { enable: true, speed: isSmall ? 1 : 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: !isSmall, mode: 'grab' }, onclick: { enable: true, mode: 'push' } }
        },
        retina_detect: true
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    updateFileName();
});
