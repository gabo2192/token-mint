import MintInfo from "@/components/mint-info";

interface Props {
  params: {
    slug: string;
  };
}

export default function Page({ params: { slug } }: Props) {
  return (
    <main>
      <MintInfo mintKey={slug} />
    </main>
  );
}
