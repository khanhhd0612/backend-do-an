const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY,
    process.env.MJ_SECRET_KEY
);

const sendMail = async ({ to, subject, text, html }) => {
    return mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: process.env.EMAIL,
                    Name: process.env.APP_NAME
                },
                To: [
                    {
                        Email: to
                    }
                ],
                Subject: subject,
                TextPart: text,
                HTMLPart: html
            }
        ]
    });
};

module.exports = {
    sendMail
};
