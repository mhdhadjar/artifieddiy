import { ContactForm } from '@/components/contact-form';
import { InfoPage } from '@/components/info-page';
import { contactEmail, pageMetadata } from '@/lib/site';

const description =
  'Questions about a build, a product link, or this site.';

export const metadata = pageMetadata('Contact', description, '/contact');

export default function ContactPage() {
  return (
    <InfoPage title="Contact" lede={description}>
      <p className="leading-7 text-muted dark:text-muted-dark">
        Email{' '}
        <a
          href={`mailto:${contactEmail}`}
          className="font-medium text-yt hover:text-yt-press"
        >
          {contactEmail}
        </a>
        , or use the form. It opens your email app with the message filled in.
      </p>
      <ContactForm />
    </InfoPage>
  );
}
