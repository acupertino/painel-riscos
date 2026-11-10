import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  // Os registros manuais (dados/*.json) são lidos do disco em tempo de execução: inclui a pasta no
  // pacote do servidor para que existam na Vercel.
  outputFileTracingIncludes: {
    '/*': ['./dados/**/*'],
  },
};

export default nextConfig;
