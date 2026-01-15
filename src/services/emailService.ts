export interface EmailTemplate {
    id: string;
    name: string;
    recipientType: 'USER' | 'ADMIN' | 'CUSTOM';
    senderName: string;
    senderEmail: string;
    subject: string;
    body: string; // Supports {{variable}} placeholders
    description: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: 'VISITOR_WELCOME',
        name: 'Ziyaretçi - Hoşgeldiniz',
        recipientType: 'USER',
        senderName: 'Event 4 Network',
        senderEmail: 'info@event4network.com',
        subject: 'Başvurunuz Alındı - Event 4 Network',
        body: `Sayın {{name}},\n\nEvent 4 Network ziyaretçi başvurunuz başarıyla alınmıştır. Talebiniz ilgili birimlerimiz tarafından incelenip en kısa sürede size dönüş yapılacaktır.\n\nİlginiz için teşekkür ederiz.\n\nSaygılarımızla,\nEvent 4 Network Ekibi`,
        description: 'Ziyaretçi başvuru formunu dolduran kişiye giden otomatik onay maili.'
    },
    {
        id: 'VISITOR_ADMIN_ALERT',
        name: 'Ziyaretçi - Yönetici Bildirimi',
        recipientType: 'ADMIN',
        senderName: 'E4N Sistem',
        senderEmail: 'system@event4network.com',
        subject: 'Yeni Ziyaretçi Başvurusu: {{name}}',
        body: `Sayın Yönetici,\n\nYeni bir ziyaretçi başvurusu alındı.\n\nİsim: {{name}}\nŞirket/Meslek: {{company}} / {{profession}}\nİletişim: {{email}} - {{phone}}\n\nLütfen yönetim panelinden başvuruyu inceleyiniz.`,
        description: 'Yeni bir ziyaretçi kaydı olduğunda yöneticilere/başkanlara giden bildirim.'
    },
    {
        id: 'MEMBER_WELCOME',
        name: 'Yeni Üye - Hoşgeldiniz',
        recipientType: 'USER',
        senderName: 'Event 4 Network Üyelik',
        senderEmail: 'uyelik@event4network.com',
        subject: 'Aramıza Hoşgeldiniz!',
        body: `Sayın {{name}},\n\nEvent 4 Network ailesine katılımınız onaylanmıştır. Hesabınıza giriş yaparak profilinizi düzenleyebilir ve etkinliklere katılmaya başlayabilirsiniz.\n\nŞifrenizi oluşturmak için lütfen tıklayın: {{link}}\n\nBaşarılar dileriz.`,
        description: 'Üyeliği onaylanan kişiye giden mail.'
    },
    {
        id: 'MEETING_REQUEST',
        name: 'Toplantı İsteği',
        recipientType: 'USER',
        senderName: 'E4N Toplantı Asistanı',
        senderEmail: 'calendar@event4network.com',
        subject: 'Yeni Toplantı İsteği',
        body: `Sayın Üyemiz,\n\n{{sender}} sizinle bir 1-e-1 toplantı yapmak istiyor.\n\nKonu: {{topic}}\nTarih: {{date}}\n\nLütfen panelden isteği cevaplayınız.`,
        description: 'Bir üye diğerinden toplantı istediğinde giden bildirim.'
    },
    {
        id: 'MEETING_CONFIRMED',
        name: 'Toplantı Onayı',
        recipientType: 'USER',
        senderName: 'E4N Calendar',
        senderEmail: 'calendar@event4network.com',
        subject: 'Toplantınız Onaylandı ✅',
        body: `Harika! 1-e-1 toplantınız onaylandı.\n\nKonu: {{topic}}\nTarih: {{date}}\n\nTakviminize eklemek için aşağıdaki linke tıklayın:\n{{link}}\n\nİyi toplantılar!`,
        description: 'Toplantı kabul edildiğinde giden onay ve takvim linki.'
    },
    {
        id: 'SHUFFLE_NOTIFICATION',
        name: 'Yeni Grup Bildirimi',
        recipientType: 'USER',
        senderName: 'Event 4 Network',
        senderEmail: 'info@event4network.com',
        subject: 'Yeni Grubunuz Belli Oldu! - E4N',
        body: `Sayın {{name}},\n\nGrup değişiklikleri (shuffle) tamamlanmıştır.\n\nYeni Grubunuz: {{groupName}}\n\nYeni grubunuzla harika bir dönem ve bol kazançlı networkler dileriz!\n\nDetayları görüntülemek için lütfen yönetim paneline giriş yapınız:\nhttp://localhost:5173/dashboard\n\nSaygılarımızla,\nEvent 4 Network Ekibi`,
        description: 'Shuffle sonrası üyelere yeni gruplarını bildiren mail.'
    },
    {
        id: 'REFERRAL_RECEIVED',
        name: 'Yeni İş Yönlendirmesi',
        recipientType: 'USER',
        senderName: 'E4N Referral System',
        senderEmail: 'referrals@event4network.com',
        subject: 'Tebrikler! Yeni Bir İş Yönlendirmeniz Var 🎉',
        body: `Sayın {{name}},\n\n{{sender}} size yeni bir iş yönlendirmesinde bulundu!\n\nYönlendirme Detayları:\nTür: {{type}}\nSıcaklık: {{temperature}}\nAçıklama: {{description}}\n\nDetayları görüntülemek ve aksiyon almak için panelinizi ziyaret ediniz.\n\nBol kazançlar dileriz!`,
        description: 'Bir üyeye yeni iş yönlendirmesi yapıldığında giden bildirim.'
    }
];

class EmailService {
    private templates: EmailTemplate[];

    constructor() {
        // Load from local storage or use defaults
        const saved = localStorage.getItem('e4n_email_templates');
        this.templates = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    }

    getTemplates() {
        return this.templates;
    }

    updateTemplate(id: string, updates: Partial<EmailTemplate>) {
        this.templates = this.templates.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        this.save();
    }

    resetTemplates() {
        this.templates = DEFAULT_TEMPLATES;
        this.save();
    }

    private save() {
        localStorage.setItem('e4n_email_templates', JSON.stringify(this.templates));
    }

    // Send email via local backend
    async sendEmail(templateId: string, recipientEmail: string, data: Record<string, string>) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            console.error(`Email template not found: ${templateId}`);
            return;
        }

        let body = template.body;
        let subject = template.subject;

        // Replace placeholders
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, data[key]);
            subject = subject.replace(regex, data[key]);
        });

        try {
            const response = await fetch('http://localhost:3001/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: subject,
                    text: body, // Plain text
                    html: body.replace(/\n/g, '<br>') // Simple HTML conversion
                })
            });

            if (!response.ok) {
                throw new Error('Backend error');
            }

            console.log(`Email sent successfully to ${recipientEmail}`);
            this.logEmail(template, recipientEmail, subject, 'SENT');
        } catch (e) {
            console.error('Failed to send email:', e);
            this.logEmail(template, recipientEmail, subject, 'FAILED');
        }
    }

    private logEmail(template: EmailTemplate, to: string, subject: string, status: 'SENT' | 'FAILED' = 'SENT') {
        const logs = JSON.parse(localStorage.getItem('e4n_email_logs') || '[]');
        logs.unshift({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            templateName: template.name,
            sender: template.senderEmail,
            recipient: to,
            subject: subject,
            status: status
        });
        // Keep last 50
        if (logs.length > 50) logs.pop();
        localStorage.setItem('e4n_email_logs', JSON.stringify(logs));
    }

    getLogs() {
        return JSON.parse(localStorage.getItem('e4n_email_logs') || '[]');
    }
}

export const emailService = new EmailService();
