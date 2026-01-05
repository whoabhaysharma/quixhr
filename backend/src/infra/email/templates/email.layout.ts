
interface EmailLayoutProps {
    title: string;
    content: string;
    previewText?: string;
}

export const emailLayout = ({ title, content, previewText }: EmailLayoutProps): string => {
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    
    <!-- Import Lexend Font - Multiple Methods for Compatibility -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
        
        /* Forces the font on clients that support webfonts */
        * {
            font-family: 'Lexend', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
    </style>

    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <style type="text/css">
        body, table, td, h1, h2, p, a, span {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Lexend', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 0;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 48px 0 32px 0; background-color: #ffffff;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="width: 64px; height: 64px; background-color: #000000; border-radius: 12px; font-family: 'Lexend', Arial, Helvetica, sans-serif; font-weight: 700; font-size: 36px; line-height: 64px; color: #ffffff; text-align: center;">
                                        Q
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; background-color: #ffffff;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0 0 8px 0; color: #000000; font-size: 13px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">QuixHR</p>
                            <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Lexend', Arial, sans-serif;">&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
                            <p style="margin: 0; color: #737373; font-size: 12px; font-family: 'Lexend', Arial, sans-serif;">This is an automated message. Please do not reply to this email.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
