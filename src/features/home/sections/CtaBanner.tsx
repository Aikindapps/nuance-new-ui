import { Link } from "react-router-dom";

export function CtaBanner() {
  return (
    <section className="bg-brand-gradient flex flex-col items-start gap-8 overflow-hidden rounded-[24px] p-8 text-white md:flex-row md:items-center md:justify-between md:p-12 lg:py-20 lg:pr-16 lg:pl-[66px] xl:pl-[120px]">
      <div className="max-w-[452px]">
        <h2 className="text-[32px] font-bold leading-tight md:text-[40px] md:leading-[40px]">
          Join the on-chain blogging revolution!
        </h2>
        <p className="mt-4 text-body">
          Nuance is a blockchain blog platform empowering writers all over the
          world. Become a writer and share your knowledge unlimited!
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 md:w-[280px] md:shrink-0">
        <Link
          to="/signup"
          className="flex h-12 items-center justify-center rounded-card bg-white px-6 text-body font-medium text-brand-purple transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="flex h-12 items-center justify-center rounded-card border border-white px-6 text-body font-medium text-white transition-colors hover:bg-white-10"
        >
          Login
        </Link>
      </div>
    </section>
  );
}
