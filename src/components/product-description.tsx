export default function ProductDescription({ description }: { description?: string }) {
    if (!description) {
      return <p className="text-sm text-gray-500">Sin descripción.</p>;
      }
    return (
      <article className="prose max-w-none prose-p:my-2 prose-headings:text-custom-dark-green">
        <p className="whitespace-pre-wrap text-custom-black/90">{description}</p>
      </article>
    );
  }
  