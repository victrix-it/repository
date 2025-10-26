# DNS Configuration for servicedesk.victrix-it.com

This document outlines the DNS records needed to configure **servicedesk.victrix-it.com** for email sending and the Victrix Servicedesk Solution.

## Required DNS Records

### 1. A Record (Website)
Point your subdomain to your Replit deployment:

```
Type: A
Host: servicedesk
Value: [Your Replit deployment IP]
TTL: 3600
```

**Note**: For Replit deployments, you typically use a CNAME instead:
```
Type: CNAME
Host: servicedesk
Value: [your-replit-app-url].replit.app
TTL: 3600
```

### 2. MX Records (Mail Exchange)
Configure these if you're receiving emails at servicedesk.victrix-it.com (not required if only sending):

**For receiving email (if using a mail provider like Google Workspace, Microsoft 365, etc.):**
```
Type: MX
Host: servicedesk
Priority: 10
Value: [your-mail-provider-mx-server]
TTL: 3600
```

**For sending-only setup**: No MX records are needed.

### 3. SPF Record (Sender Policy Framework)
This tells receiving mail servers which servers are authorized to send email on behalf of your domain.

```
Type: TXT
Host: servicedesk
Value: v=spf1 include:[your-smtp-provider] ~all
TTL: 3600
```

**Examples**:
- **SendGrid**: `v=spf1 include:sendgrid.net ~all`
- **Mailgun**: `v=spf1 include:mailgun.org ~all`
- **Amazon SES**: `v=spf1 include:amazonses.com ~all`
- **Custom SMTP server**: `v=spf1 ip4:YOUR.SERVER.IP.ADDRESS ~all`

**Explanation**:
- `v=spf1` - SPF version 1
- `include:[provider]` - Authorizes the provider's servers
- `~all` - Soft fail for all other servers (recommended for testing)
- `-all` - Hard fail for all other servers (use after testing)

### 4. DKIM Record (DomainKeys Identified Mail)
DKIM adds a digital signature to your emails. Your SMTP provider will give you the DKIM record.

```
Type: TXT
Host: [selector]._domainkey.servicedesk
Value: [provided by your SMTP provider]
TTL: 3600
```

**How to get your DKIM record**:
1. Log into your SMTP provider (SendGrid, Mailgun, SES, etc.)
2. Go to email authentication settings
3. Copy the DKIM DNS record they provide
4. Add it to your DNS

**Example format** (actual values will be much longer):
```
Host: mail._domainkey.servicedesk
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### 5. DMARC Record (Domain-based Message Authentication)
DMARC builds on SPF and DKIM to prevent email spoofing.

```
Type: TXT
Host: _dmarc.servicedesk
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@victrix-it.com; pct=100
TTL: 3600
```

**Progressive DMARC policy**:
1. **Start with**: `p=none` (monitoring mode, no enforcement)
2. **After testing**: `p=quarantine` (suspicious emails go to spam)
3. **Full enforcement**: `p=reject` (reject unauthorized emails)

**Full DMARC example**:
```
v=DMARC1; p=none; rua=mailto:dmarc-reports@victrix-it.com; ruf=mailto:dmarc-failures@victrix-it.com; fo=1; pct=100; adkim=r; aspf=r
```

**Explanation**:
- `v=DMARC1` - DMARC version 1
- `p=none` - Policy (none/quarantine/reject)
- `rua=` - Aggregate report email address
- `ruf=` - Forensic report email address
- `fo=1` - Generate forensic reports for any failure
- `pct=100` - Apply policy to 100% of emails
- `adkim=r` - Relaxed DKIM alignment
- `aspf=r` - Relaxed SPF alignment

### 6. PTR Record (Reverse DNS)
Optional but recommended for better deliverability. This is configured with your hosting/IP provider, not in your domain's DNS.

**For sending from your own server**:
Contact your hosting provider to set up PTR record:
```
YOUR.SERVER.IP.ADDRESS → servicedesk.victrix-it.com
```

## Complete DNS Configuration Example

Assuming you're using **SendGrid** as your SMTP provider:

```dns
# Website/Application
Type: CNAME
Host: servicedesk
Value: victrix-servicedesk.replit.app
TTL: 3600

# SPF Record
Type: TXT
Host: servicedesk
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600

# DKIM Record (get actual values from SendGrid)
Type: TXT
Host: s1._domainkey.servicedesk
Value: [DKIM key from SendGrid - very long string]
TTL: 3600

# DMARC Record
Type: TXT
Host: _dmarc.servicedesk
Value: v=DMARC1; p=none; rua=mailto:admin@victrix-it.com; pct=100
TTL: 3600
```

## SMTP Configuration in Victrix Servicedesk

After configuring DNS, set up these SMTP settings in the admin panel:

1. **SMTP Host**: Your provider's SMTP server (e.g., `smtp.sendgrid.net`)
2. **SMTP Port**: Usually 587 (TLS) or 465 (SSL)
3. **SMTP User**: Your SMTP username/API key
4. **SMTP Password**: Your SMTP password/API key secret
5. **SMTP From**: `servicedesk@victrix-it.com` or `no-reply@servicedesk.victrix-it.com`
6. **SMTP Secure**: true for port 465, false for port 587

## Recommended SMTP Providers

### For Production Use:
1. **SendGrid** - 100 free emails/day, excellent deliverability
2. **Mailgun** - 5,000 free emails/month for 3 months
3. **Amazon SES** - Very cheap, $0.10 per 1,000 emails
4. **Postmark** - Premium deliverability, transactional focus

### For Testing:
1. **Mailtrap** - Email testing in staging
2. **MailHog** - Local email testing (self-hosted)

## Verification Steps

After adding DNS records:

1. **Wait for DNS propagation** (can take up to 48 hours, usually faster)
2. **Check SPF**: https://mxtoolbox.com/spf.aspx
3. **Check DKIM**: https://mxtoolbox.com/dkim.aspx
4. **Check DMARC**: https://mxtoolbox.com/dmarc.aspx
5. **Send test email** from Victrix Servicedesk
6. **Check email headers** to verify SPF/DKIM pass
7. **Monitor DMARC reports** at configured rua email address

## Troubleshooting

### Emails going to spam:
- Verify SPF, DKIM, and DMARC are all passing
- Check IP reputation: https://mxtoolbox.com/blacklists.aspx
- Ensure PTR record is configured
- Gradually increase email volume (avoid sudden spikes)

### DNS not resolving:
- Use `dig` or `nslookup` to check records: `dig TXT servicedesk.victrix-it.com`
- Wait 24-48 hours for full propagation
- Clear local DNS cache

### SMTP connection failing:
- Verify firewall allows outbound connections on port 587/465
- Check SMTP credentials are correct
- Test connection using telnet: `telnet smtp.provider.com 587`

## Security Best Practices

1. **Use TLS** - Always use encrypted connections (port 587 or 465)
2. **Rotate credentials** - Change SMTP passwords regularly
3. **Monitor logs** - Watch for unauthorized email sending
4. **Rate limiting** - Implement email rate limits to prevent abuse
5. **DMARC reporting** - Monitor reports weekly to catch issues
6. **Dedicated IP** - For high volume (>100k emails/month), consider dedicated IP

## Next Steps

1. Choose an SMTP provider
2. Sign up and get credentials
3. Add DNS records to your domain
4. Wait for DNS propagation
5. Configure SMTP in Victrix Servicedesk admin panel
6. Send test emails
7. Monitor deliverability and adjust DMARC policy

---

**Support**: For questions about email configuration in Victrix Servicedesk, contact your system administrator.
