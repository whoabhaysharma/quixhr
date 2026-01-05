
interface EmailLayoutProps {
    title: string;
    content: string;
    previewText?: string;
}

export const emailLayout = ({ title, content, previewText }: EmailLayoutProps): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!-- Import Lexend Font -->
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=swap" rel="stylesheet">
    <style>
        /* Reset */
        body, html { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        * { box-sizing: border-box; }
        
        /* Base Styles */
        body {
            font-family: 'Lexend', Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        
        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            border-radius: 8px;
            overflow: hidden;
            background-color: transparent;
        }
        
        /* content-card */
        .content-card {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 40px;
            margin-bottom: 24px;
        }

        /* Logo */
        .logo-container {
            text-align: center;
            padding: 40px 0 24px;
        }
        .logo-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background-color: #4f46e5; /* Indigo-600 */
            color: white;
            border-radius: 12px;
            font-family: 'Lexend', sans-serif;
            font-weight: 700;
            font-size: 28px;
            line-height: 1;
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
        }
        .brand-name {
            display: block;
            margin-top: 12px;
            font-size: 18px;
            font-weight: 600;
            color: #334155;
            text-decoration: none;
            display: none; /* Hidden as per request to focus on Logo Q, but kept structure if needed */
        }
        
        /* Typography */
        h1 {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 24px;
            text-align: center;
            letter-spacing: -0.025em;
        }
        p {
            margin: 0 0 16px;
            color: #475569;
            font-size: 16px;
        }
        strong { color: #1e293b; font-weight: 600; }
        
        /* Button */
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            padding: 14px 32px;
            border-radius: 50px; /* Pill shape */
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
            margin: 24px 0;
        }
        .btn:hover {
            background-color: #4338ca;
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 0 20px 40px;
            color: #94a3b8;
            font-size: 12px;
        }
        .footer p {
            color: #94a3b8;
            font-size: 12px;
            margin-bottom: 8px;
        }
        
        /* Utilities */
        .text-center { text-align: center; }
        .text-sm { font-size: 14px; }
        .text-muted { color: #64748b; }
        .mb-4 { margin-bottom: 16px; }
        .mt-4 { margin-top: 16px; }
        
        /* Highlight Box */
        .highlight-box {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            border-left: 4px solid #4f46e5;
        }

    </style>
</head>
<body>
    <div style="background-color: #f8fafc; padding: 20px 0; width: 100%; min-height: 100%;">
        <div class="email-container">
            <!-- Logo Header -->
            <div class="logo-container">
                <div class="logo-box">Q</div>
            </div>

            <!-- Content Card -->
            <div class="content-card">
                ${content}
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
                <p>This email was sent automatically by QuixHR.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
