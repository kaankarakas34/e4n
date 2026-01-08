
export interface MailTemplate {
    subject: string;
    body: (data: any) => string;
}

export const MAIL_TEMPLATES = {
    WELCOME: {
        subject: 'Hoş Geldiniz!',
        body: (data: any) => `Merhaba ${data.name}, aramıza hoş geldiniz. Üyeliğiniz oluşturuldu.`
    },
    SUBSCRIPTION_REMINDER_60: {
        subject: 'Üyeliğinizin Bitmesine 2 Ay Kaldı - Fırsatı Kaçırmayın',
        body: (data: any) => `Sayın ${data.name},\n\nÜyeliğinizin bitmesine 60 gün kaldı. Şimdi yenileyerek avantajlardan yararlanabilirsiniz.`
    },
    SUBSCRIPTION_REMINDER_30: {
        subject: 'ACİL: Üyeliğinizin Bitmesine 1 Ay Kaldı!',
        body: (data: any) => `Sayın ${data.name},\n\nÜyeliğiniz 30 gün içinde sona erecek. Erken yenileme kampanyasından (%10 İndirim) yararlanmak için son günler!`
    },
    FRIEND_REQUEST: {
        subject: 'Yeni Bağlantı İsteği',
        body: (data: any) => `${data.requesterName} sizinle bağlantı kurmak istiyor.`
    }
};

export const mailService = {
    async sendMail(to: string, template: MailTemplate, data: any) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log(`[MAIL SERVICE] Sending to: ${to}`);
        console.log(`Subject: ${template.subject}`);
        console.log(`Body: ${template.body(data)}`);

        return { success: true, messageId: Math.random().toString(36).substr(2) };
    }
};
