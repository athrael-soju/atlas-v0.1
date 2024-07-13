
# Atlas
![image](https://github.com/athrael-soju/Atlas/assets/25455658/ab671d95-bf17-4fdc-a9ea-c309f5eeed6e)

## Architecture
![image](https://github.com/athrael-soju/next-ai-src/assets/25455658/3c1f3c78-f484-4bd2-8149-3f73312e0545)

## Mermaid Chart
```
flowchart TD
    A[Start: User Login] --> B{User Selects}
    B --> |Data Load| C1[Document Uploaded]
    B --> |Data Query| D1[User Prompt]

    subgraph Atlas High Level Architecture
        subgraph Feature1 [Data Load]
            C1 --> C2[Document Storage] 
            C2 --> C3{{Document Parsing}}
            C3 --> C4{{Chunk Embedding}}
            C4 --> C5[(Chunk Indexing)]
        end
        subgraph Feature2 [Data Query]
            D1 --> D2{{Document Embedding}}
            D2 --> D3[(Semantic Search)]
            D2 --> D4[(Keyword Search)]
            D2 --> D5{{Web Crawl}}
            D3 --> D6{{Re-ranking Results}}
            D4 --> D6
            D5 --> D6
            D6 --> D7{{LLM Inference}}
        end
    end
```
## Experimental Mermaid Chart
```
flowchart LR
    subgraph Data_Ingestion_and_Processing["Data Ingestion and Processing"]
        S["Start"] --> |"Files Updated"| AK["Apache Kafka"]
        AK -->|Data Ingestion| AS["Apache Spark"]
        AS -->|File Processing| U["unstructured.io"]
        U -->|Chunking| EM["Embedder"]
        EM -->|Vectorize Data| PC["Pinecone"]
        PC --> |Indexing| D["End"]
    end

    subgraph Monitoring_and_Alerts["Monitoring and Alerts"]
        PM["Prometheus"]
        GR["Grafana"]
    end

    subgraph Data_Query_and_Response["Data Query and Response"]
        UL["Start"] -->|Prompt / Query| PS["Pinecone"]
        PS --> |"Perform Similarity Search"| CR["Cohere"]
        CR --> |"Re-rank TopK to TopN"| LLM["Large Language Model"]
        LLM --> |"Perform Inference"| RT["End"]                
    end

    Data_Ingestion_and_Processing <-->|Monitoring| Monitoring_and_Alerts
    Monitoring_and_Alerts <-->|Visualization| Data_Query_and_Response
```
## Features

- Store millions of documents and retrieve information seamlessly.
- Integrate ATLAS with any large language model while retaining all your data.
- Secure data storage with the ability to delete data at any time.
- Lightweight and non-intrusive, ensuring no burden on existing applications.
- Supports a multitude of file formats, depending on your chosen tier of service.
- Empowers users to control how their documents are processed.
- Scalable to handle millions of users, each with personal documents and memories.
- Works with top providers worldwide for customizable data storage solutions.
- Adheres to data privacy regulations for supported regions.
- Improves LLM interactions by addressing hallucinations, inaccuracies, low context size, and dependency on training data.

## Quick Links

- [Read the blog post](https://vercel.com/blog/ai-sdk-3-generative-ui)
- [See the demo](https://sdk.vercel.ai/demo)
- [Visit the docs](https://sdk.vercel.ai/docs/concepts/ai-rsc)

## Deploy Your Own

You can deploy your own version of the demo to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Fblob%2Fmain%2Fexamples%2Fnext-ai-rsc&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20Key&envLink=https%3A%2F%2Fplatform.openai.com%2Fapi-keys&project-name=vercel-ai-rsc&repository-name=vercel-ai-rsc)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

## Authors

This library is created by [Vercel](https://vercel.com) and [Next.js](https://nextjs.org) team members, with contributions from:

- Athos Georgiou ([@athos.georgiou_](https://athosgeorgiou.com)) - [Vercel](https://linked.com/athosg)
