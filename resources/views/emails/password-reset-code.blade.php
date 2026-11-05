<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Helix Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7f5;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                    <tr>
                        <td align="center" style="background-color:#000000;padding:28px 24px;">
                            <img src="{{ config('app.url') }}/email/helix-icon.png" width="96" height="96" alt="Helix" style="display:block;border:0;outline:none;text-decoration:none;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 32px 8px 32px;color:#000F14;">
                            <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:bold;">Reset your password</h1>
                            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#4b5563;">
                                Hello {{ $name }}, use the code below to reset your Helix password.
                            </p>
                            <div style="margin:0 0 20px 0;padding:18px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;text-align:center;">
                                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#000F14;">{{ $code }}</span>
                            </div>
                            <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">
                                This code expires in {{ $minutes }} minutes.
                            </p>
                            <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;color:#6b7280;">
                                If you did not request a password reset, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;">
                            &copy; {{ date('Y') }} Helix &middot; Medicine with data
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
