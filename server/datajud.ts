/**
 * Integração com API Pública DataJud do CNJ
 * Documentação: https://datajud-wiki.cnj.jus.br/api-publica/
 */

const DATAJUD_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

const TRIBUNAL_ENDPOINTS = {
  TJSP: "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search",
  TRT2: "https://api-publica.datajud.cnj.jus.br/api_publica_trt2/_search",
  TRT15: "https://api-publica.datajud.cnj.jus.br/api_publica_trt15/_search",
} as const;

export type TribunalCode = keyof typeof TRIBUNAL_ENDPOINTS;

interface DatajudMovement {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    valor: number | string;
    nome: string;
    descricao: string;
  }>;
}

interface DatajudProcessResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: Array<{
      _id: string;
      _source: {
        numeroProcesso: string;
        classe?: {
          codigo: number;
          nome: string;
        };
        tribunal: string;
        dataAjuizamento?: string;
        dataHoraUltimaAtualizacao?: string;
        movimentos?: DatajudMovement[];
        orgaoJulgador?: {
          codigo: number;
          nome: string;
        };
        assuntos?: Array<{
          codigo: number;
          nome: string;
        }>;
      };
    }>;
  };
}

/**
 * Consulta processo na API DataJud
 */
export async function fetchProcessFromDatajud(
  processNumber: string,
  tribunal: TribunalCode
): Promise<DatajudProcessResponse | null> {
  try {
    const endpoint = TRIBUNAL_ENDPOINTS[tribunal];
    
    // Remove caracteres não numéricos do número do processo
    const cleanProcessNumber = processNumber.replace(/\D/g, "");
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanProcessNumber,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error(`[DataJud] Erro ao consultar processo ${processNumber} no ${tribunal}:`, response.status);
      return null;
    }

    const data: DatajudProcessResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`[DataJud] Erro ao consultar processo ${processNumber}:`, error);
    return null;
  }
}

/**
 * Extrai movimentações de um processo consultado
 */
export function extractMovements(response: DatajudProcessResponse): Array<{
  code: number;
  name: string;
  publishedAt: Date;
  content: string;
  externalId: string;
}> {
  if (!response.hits.hits.length) {
    return [];
  }

  const processData = response.hits.hits[0]._source;
  const movements = processData.movimentos || [];

  return movements.map((mov) => {
    const complements = mov.complementosTabelados
      ? mov.complementosTabelados
          .map((c) => `${c.nome}: ${c.valor}`)
          .join("; ")
      : "";

    const content = complements
      ? `${mov.nome}\n\n${complements}`
      : mov.nome;

    return {
      code: mov.codigo,
      name: mov.nome,
      publishedAt: new Date(mov.dataHora),
      content,
      externalId: `${processData.tribunal}_${processData.numeroProcesso}_${mov.codigo}_${mov.dataHora}`,
    };
  });
}

/**
 * Monitora processo e retorna novas movimentações
 * Compara com movimentações já conhecidas (array de externalIds)
 */
export async function checkForNewMovements(
  processNumber: string,
  tribunal: TribunalCode,
  knownExternalIds: string[]
): Promise<Array<{
  code: number;
  name: string;
  publishedAt: Date;
  content: string;
  externalId: string;
}>> {
  const response = await fetchProcessFromDatajud(processNumber, tribunal);
  
  if (!response) {
    return [];
  }

  const allMovements = extractMovements(response);
  
  // Retorna apenas movimentações que não estão no array de IDs conhecidos
  return allMovements.filter(
    (mov) => !knownExternalIds.includes(mov.externalId)
  );
}
