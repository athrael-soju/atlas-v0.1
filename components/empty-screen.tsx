import { ExternalLink } from '@/components/external-link';

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary sm:p-4 p-2 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block mx-auto text-center">
          Welcome to Atlas
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Atlas is a comprehensive data management solution that offers advanced
          capabilities in processing, analysis, storage, and security.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          It efficiently processes both structured and unstructured data,
          preparing it for in-depth analysis. With exceptional accuracy and
          speed, it manages data to serve as a robust knowledgebase. For
          real-time analysis and visualization, it provides insightful and
          scalable data interpretation. It ensures efficient storage and rapid
          retrieval of data, optimizing overall data management. Additionally,
          Atlas delivers strong data security and privacy, adhering to the
          latest standards to protect sensitive information.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          These integrated features make Atlas a versatile and powerful tool for
          managing and leveraging data effectively across various applications
          and industries.
        </p>
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: This is a demo application. For more information, please <ExternalLink href="https://nextjs.org">Contact sales</ExternalLink>
      </p>
    </div>
  );
}
