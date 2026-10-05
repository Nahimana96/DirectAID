declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    APP_MODE?: string;
    ADMIN_EMAILS?: string;
    SITE_URL?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    JOBS_SECRET?: string;
  }
}
