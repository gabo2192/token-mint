import VestingForm from "@/components/vesting-form";

interface Props {
  params: {
    slug: string;
  };
}

export default function Page({ params: { slug } }: Props) {
  return (
    <main className="mt-10 grid place-items-center">
      <VestingForm mintKey={slug} />
    </main>
  );
}
