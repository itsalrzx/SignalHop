import { LinkDialog } from '@/components/link-dialog';
import { LinksTable } from '@/components/links-table';
export default function LinksPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">YOUR COLLECTION</p>
          <h1>My links</h1>
          <p>Everything you share, all in one place.</p>
        </div>
        <LinkDialog />
      </div>
      <LinksTable />
    </>
  );
}
