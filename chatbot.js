(function () {
  const responses = [
    {
      patterns: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good evening'],
      reply: "👋 Hello! Welcome to GS SoftTech. I'm here to help. Ask me about our services, tech stack, pricing, or how to get in touch!"
    },
    {
      patterns: ['service', 'offer', 'do you', 'what can', 'provide', 'help with'],
      reply: "We offer:\n• 🎨 Web Design & UI/UX\n• 💻 Full-Stack Development\n• 🏛️ System Design & Architecture\n• ☸️ Kubernetes & DevOps\n• 🌐 Distributed Systems\n• 🤖 AI / LLM Integration\n• 🚀 DNS, SSL & Cloud Deployment\n\nWhich area interests you?",
      chips: ['Web Design', 'Full-Stack Dev', 'Kubernetes', 'AI Integration']
    },
    {
      patterns: ['web design', 'ui', 'ux', 'design', 'branding', 'responsive'],
      reply: "Our Web Design service covers UI/UX design, branding, mobile-responsive layouts, and modern visual experiences. We build sites that look great and convert visitors."
    },
    {
      patterns: ['full-stack', 'full stack', 'development', 'frontend', 'backend', 'html', 'css', 'javascript', 'react', 'node'],
      reply: "We build complete web applications — frontend (React, HTML/CSS/JS) and backend (Node.js, APIs, databases). End-to-end delivery from design to deployment."
    },
    {
      patterns: ['kubernetes', 'devops', 'docker', 'container', 'k8s', 'ci/cd', 'cicd', 'deployment', 'deploy'],
      reply: "☸️ We design and manage Kubernetes clusters, CI/CD pipelines, Docker containerisation, and cloud deployments on AWS, GCP, and Azure."
    },
    {
      patterns: ['ai', 'llm', 'machine learning', 'ml', 'automation', 'chatgpt', 'openai', 'artificial'],
      reply: "🤖 We integrate LLMs and AI automation into your workflows — from intelligent chatbots to automated data pipelines and AI-powered web apps."
    },
    {
      patterns: ['system design', 'architecture', 'distributed', 'microservice', 'scalab', 'scale'],
      reply: "🏛️ We architect distributed systems, microservices, event-driven systems, and cloud-native solutions built for scale, reliability, and security."
    },
    {
      patterns: ['dns', 'domain', 'ssl', 'cdn', 'hosting', 'cloud'],
      reply: "🌐 We handle everything from domain registration and DNS configuration to SSL certificates, CDN setup, and cloud hosting on major providers."
    },
    {
      patterns: ['seo', 'search', 'google', 'rank', 'optimis'],
      reply: "🔍 Our SEO service covers on-page optimisation, technical SEO, site speed, structured data, and ongoing performance monitoring to boost your Google rankings."
    },
    {
      patterns: ['price', 'pricing', 'cost', 'how much', 'charge', 'quote', 'rate', 'fee'],
      reply: "💬 Pricing depends on project scope. We offer flexible packages for startups and businesses. Get a free, no-obligation quote — just reach out!\n\nWould you like to contact us?",
      chips: ['Contact us', 'WhatsApp']
    },
    {
      patterns: ['contact', 'reach', 'email', 'phone', 'call', 'enquiry', 'inquiry', 'get in touch', 'talk'],
      reply: "📬 You can reach us at:\n\n✉️ info@gssofttech.com\n📱 +91 78373 94742\n🌐 www.gssofttech.com\n\nOr use the contact form on our Contact page.",
      chips: ['Open Contact page', 'WhatsApp us']
    },
    {
      patterns: ['whatsapp', 'whats app', 'message', 'chat'],
      reply: "📲 You can WhatsApp us directly at +91 78373 94742. We usually respond within a few hours!"
    },
    {
      patterns: ['about', 'who are you', 'who is', 'gagandeep', 'team', 'founder'],
      reply: "👨‍💻 GS SoftTech is founded by Gagandeep Singh — a full-stack engineer and cloud architect with expertise in web development, Kubernetes, distributed systems, and AI/LLM integration."
    },
    {
      patterns: ['location', 'where', 'based', 'office', 'country', 'india', 'uk'],
      reply: "📍 GS SoftTech serves clients globally. Get in touch and we'll discuss how we can work together wherever you are."
    },
    {
      patterns: ['tech', 'stack', 'technology', 'language', 'framework', 'tool'],
      reply: "🔧 Our tech stack includes:\nReact · Node.js · Python · Kubernetes · Docker · Terraform · AWS · GCP · Azure · PostgreSQL · MongoDB · Redis · Elasticsearch"
    },
    {
      patterns: ['security', 'secure', 'zero-trust', 'firewall', 'cybersecurity'],
      reply: "🔒 Security is core to everything we build — zero-trust architecture, SSL/TLS, firewall rules, OWASP best practices, and regular security audits."
    },
    {
      patterns: ['portfolio', 'project', 'work', 'example', 'case study', 'previous'],
      reply: "💼 Check out our work on the Services page. We'd also love to discuss your specific project — reach out for a free consultation!"
    },
    {
      patterns: ['thank', 'thanks', 'great', 'awesome', 'perfect', 'helpful'],
      reply: "😊 You're welcome! Is there anything else I can help you with?"
    },
    {
      patterns: ['bye', 'goodbye', 'see you', 'later', 'done'],
      reply: "👋 Thanks for visiting GS SoftTech! Feel free to come back anytime. Have a great day!"
    }
  ];

  const quickReplies = ['Services', 'Pricing', 'Contact us', 'Tech Stack'];

  function getReply(text) {
    const lower = text.toLowerCase();
    for (const r of responses) {
      if (r.patterns.some(p => lower.includes(p))) return r;
    }
    return {
      reply: "I'm not sure about that — but our team can help! 📬 Email us at info@gssofttech.com or use the contact form.",
      chips: ['Contact us', 'Services']
    };
  }

  function handleChip(label) {
    const chipMap = {
      'Open Contact page': () => { window.location.href = 'contact.html'; },
      'WhatsApp us': () => { window.open('https://wa.me/917837394742', '_blank'); },
      'WhatsApp': () => { window.open('https://wa.me/917837394742', '_blank'); },
    };
    if (chipMap[label]) { chipMap[label](); return; }
    addUserMessage(label);
    showTypingThenReply(label);
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function addBotMessage(text, chips) {
    const msgs = document.getElementById('gs-chat-msgs');
    const div = document.createElement('div');
    div.className = 'gs-msg gs-msg-bot';
    div.innerHTML = escHtml(text).replace(/\n/g,'<br>');
    msgs.appendChild(div);
    if (chips && chips.length) {
      const row = document.createElement('div');
      row.className = 'gs-chips';
      chips.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'gs-chip';
        btn.textContent = c;
        btn.onclick = () => handleChip(c);
        row.appendChild(btn);
      });
      msgs.appendChild(row);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMessage(text) {
    const msgs = document.getElementById('gs-chat-msgs');
    const div = document.createElement('div');
    div.className = 'gs-msg gs-msg-user';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTypingThenReply(text) {
    const msgs = document.getElementById('gs-chat-msgs');
    const typing = document.createElement('div');
    typing.className = 'gs-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      msgs.removeChild(typing);
      const r = getReply(text);
      addBotMessage(r.reply, r.chips);
    }, 900 + Math.random() * 400);
  }

  function sendMessage() {
    const input = document.getElementById('gs-chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);
    showTypingThenReply(text);
  }

  function buildChatbot() {
    const html = `
<div id="gs-chatbot">
  <button id="gs-chat-toggle" aria-label="Open chat">
    <svg id="gs-icon-chat" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    <svg id="gs-icon-close" viewBox="0 0 24 24" fill="white" width="22" height="22" style="display:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    <span id="gs-badge">1</span>
  </button>
  <div id="gs-chat-window" aria-hidden="true">
    <div id="gs-chat-header">
      <div id="gs-chat-avatar">🤖</div>
      <div>
        <strong>GS Assistant</strong>
        <span>GS SoftTech · Online</span>
      </div>
      <div id="gs-online-dot"></div>
    </div>
    <div id="gs-chat-msgs"></div>
    <div id="gs-chat-input-bar">
      <input id="gs-chat-input" type="text" placeholder="Type a message…" autocomplete="off" />
      <button id="gs-chat-send" aria-label="Send">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    let open = false;
    const toggle = document.getElementById('gs-chat-toggle');
    const win = document.getElementById('gs-chat-window');
    const badge = document.getElementById('gs-badge');
    const iconChat = document.getElementById('gs-icon-chat');
    const iconClose = document.getElementById('gs-icon-close');

    toggle.addEventListener('click', () => {
      open = !open;
      win.classList.toggle('gs-chat-open', open);
      win.setAttribute('aria-hidden', !open);
      iconChat.style.display = open ? 'none' : 'block';
      iconClose.style.display = open ? 'block' : 'none';
      badge.style.display = 'none';
      if (open && document.getElementById('gs-chat-msgs').children.length === 0) {
        setTimeout(() => {
          addBotMessage("👋 Hi! Welcome to GS SoftTech. How can I help you today?", quickReplies);
        }, 300);
      }
    });

    document.getElementById('gs-chat-send').addEventListener('click', sendMessage);
    document.getElementById('gs-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChatbot);
  } else {
    buildChatbot();
  }
})();
