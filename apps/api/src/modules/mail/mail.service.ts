import { Injectable, Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly transporter: nodemailer.Transporter

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const port = parseInt(this.configService.get<string>('MAIL_PORT') ?? '1025', 10)
    const host = this.configService.get<string>('MAIL_HOST')
    const user = this.configService.get<string>('MAIL_USER')
    const pass = this.configService.get<string>('MAIL_PASS')

    this.transporter = nodemailer.createTransport({
      host,
      port,
      ...(user && pass ? { auth: { user, pass } } : {}),
    })
  }

  async sendMagicLink(email: string, token: string, isInvite: boolean): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')
    const url = `${frontendUrl}/auth/verify?token=${encodeURIComponent(token)}`
    const from = this.configService.get<string>('MAIL_FROM')

    const subject = isInvite
      ? "Vous êtes invité à rejoindre l'application"
      : 'Votre lien de connexion'

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #111;">
  <p>${isInvite ? "Vous avez été invité à rejoindre l'application." : 'Voici votre lien de connexion :'}</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 4px;">
      ${isInvite ? "Accepter l'invitation" : 'Se connecter'}
    </a>
  </p>
  <p style="font-size: 13px; color: #666;">
    Ce lien expire dans 15 minutes. Si vous n'avez pas demandé ce lien, ignorez cet email.
  </p>
</body>
</html>`

    try {
      await this.transporter.sendMail({ from, to: email, subject, html })
      this.logger.log(`Magic link email sent to ${email}`)
    } catch (error) {
      this.logger.error(`Failed to send magic link email to ${email}`, error)
      throw new Error('Failed to send email')
    }
  }
}
