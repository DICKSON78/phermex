<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Helix Password Changed</title>
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
                            <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:bold;">Your password was changed</h1>
                            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#4b5563;">
                                Hello {{ $name }}, the password for your Helix account was changed on {{ $changedAt }}.
                            </p>
                            <div style="margin:0 0 20px 0;padding:16px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;font-size:14px;line-height:1.6;color:#166534;">
                                You can now sign in with your new password. All other sessions have been signed out.
                            </div>
                            <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;color:#6b7280;">
                                If you did not make this change, contact us immediately at
                                <a href="mailto:support@helix.co.tz" style="color:#0a8f3c;text-decoration:underline;">support@helix.co.tz</a>
                                and reset your password again.
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
