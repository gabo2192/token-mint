import VestingForm from "@/components/vesting-form";

interface Props {
  params: {
    slug: string;
  };
}

export default function Page({ params: { slug } }: Props) {
  return (
    <main className="mt-10 grid place-items-center">
      <h2>Token Vesting</h2>
      <VestingForm mintKey={slug} />
    </main>
  );
}
