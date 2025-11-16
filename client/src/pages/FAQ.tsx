import { useState } from "react";
import { ChevronDown, Search, FileQuestion } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageNavigation } from "@/components/PageNavigation";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  // Rescisão e Demissão
  {
    id: "1",
    category: "Rescisão e Demissão",
    question: "Quais são os meus direitos em caso de demissão sem justa causa?",
    answer: "Em caso de demissão sem justa causa, você tem direito a: aviso prévio (trabalhado ou indenizado), saldo de salário, férias vencidas + 1/3, férias proporcionais + 1/3, 13º salário proporcional, saque do FGTS + multa de 40%, e seguro-desemprego (se preencher os requisitos)."
  },
  {
    id: "2",
    category: "Rescisão e Demissão",
    question: "O que é demissão por justa causa?",
    answer: "A demissão por justa causa ocorre quando o empregado comete falta grave prevista em lei, como: ato de improbidade, incontinência de conduta, negociação habitual, condenação criminal, desídia, embriaguez habitual, violação de segredo da empresa, ato de indisciplina ou insubordinação, abandono de emprego, ato lesivo à honra ou ofensa física, prática constante de jogos de azar. Neste caso, o trabalhador perde direitos como aviso prévio, multa do FGTS e seguro-desemprego."
  },
  {
    id: "3",
    category: "Rescisão e Demissão",
    question: "Posso pedir demissão e sacar o FGTS?",
    answer: "Não. Em caso de pedido de demissão voluntária, o trabalhador NÃO tem direito ao saque do FGTS nem à multa de 40%. O FGTS só pode ser sacado em situações específicas como: demissão sem justa causa, aposentadoria, compra de imóvel, doenças graves, entre outras previstas em lei."
  },
  {
    id: "4",
    category: "Rescisão e Demissão",
    question: "O que é rescisão indireta?",
    answer: "A rescisão indireta é quando o empregado 'demite' o empregador por justa causa. Ocorre quando a empresa comete faltas graves como: não pagar salários, não depositar FGTS, exigir serviços superiores às forças do empregado, descumprir obrigações do contrato, reduzir trabalho por peça ou tarefa de modo a afetar sensivelmente o salário, entre outras. Neste caso, o trabalhador tem direito a TODOS os direitos da demissão sem justa causa."
  },
  
  // Férias
  {
    id: "5",
    category: "Férias",
    question: "Tenho direito a quantos dias de férias?",
    answer: "Todo trabalhador tem direito a 30 dias de férias após cada período de 12 meses de trabalho (período aquisitivo). As férias podem ser divididas em até 3 períodos, sendo que um deles não pode ser inferior a 14 dias e os demais não podem ser inferiores a 5 dias cada."
  },
  {
    id: "6",
    category: "Férias",
    question: "Como é calculado o valor das férias?",
    answer: "O valor das férias é o salário normal do trabalhador acrescido de 1/3 (um terço). Por exemplo: se você ganha R$ 3.000,00, suas férias serão R$ 3.000,00 + R$ 1.000,00 (1/3) = R$ 4.000,00. Esse valor deve ser pago até 2 dias antes do início das férias."
  },
  {
    id: "7",
    category: "Férias",
    question: "Posso vender minhas férias?",
    answer: "Sim. O trabalhador pode converter 1/3 (10 dias) do período de férias em abono pecuniário (venda de férias). Neste caso, você tira 20 dias de férias e recebe o equivalente a 10 dias trabalhados. A solicitação deve ser feita até 15 dias antes do término do período aquisitivo."
  },
  {
    id: "8",
    category: "Férias",
    question: "A empresa pode escolher quando vou tirar férias?",
    answer: "Sim. A concessão das férias é prerrogativa do empregador, que deve comunicar o empregado com antecedência mínima de 30 dias. As férias devem ser concedidas nos 12 meses seguintes ao período aquisitivo (período concessivo). Se a empresa não conceder as férias nesse prazo, deverá pagar em dobro."
  },
  
  // FGTS
  {
    id: "9",
    category: "FGTS",
    question: "O que é FGTS e como funciona?",
    answer: "O FGTS (Fundo de Garantia do Tempo de Serviço) é um depósito mensal que a empresa deve fazer em uma conta vinculada ao trabalhador na Caixa Econômica Federal. O valor corresponde a 8% do salário bruto. Esse dinheiro fica rendendo e pode ser sacado em situações específicas."
  },
  {
    id: "10",
    category: "FGTS",
    question: "Quando posso sacar o FGTS?",
    answer: "O FGTS pode ser sacado nas seguintes situações: demissão sem justa causa, rescisão indireta, término de contrato por prazo determinado, aposentadoria, compra de imóvel, doença grave (câncer, AIDS, etc.), falecimento do trabalhador, desastres naturais, idade igual ou superior a 70 anos, permanência por 3 anos sem depósito, entre outras."
  },
  {
    id: "11",
    category: "FGTS",
    question: "Qual o valor da multa do FGTS na demissão?",
    answer: "Em caso de demissão sem justa causa, a empresa deve pagar uma multa de 40% sobre o total depositado no FGTS durante o período trabalhado. Além disso, o trabalhador tem direito a sacar todo o saldo da conta do FGTS."
  },
  
  // 13º Salário
  {
    id: "12",
    category: "13º Salário",
    question: "Como funciona o 13º salário?",
    answer: "O 13º salário é um direito de todo trabalhador com carteira assinada. O valor corresponde a 1/12 (um doze avos) da remuneração por mês trabalhado. Ou seja, se você trabalhou o ano inteiro, recebe um salário integral. Se trabalhou 6 meses, recebe metade. O pagamento é feito em duas parcelas: a primeira até 30 de novembro e a segunda até 20 de dezembro."
  },
  {
    id: "13",
    category: "13º Salário",
    question: "Fui demitido, tenho direito ao 13º?",
    answer: "Sim. Em caso de demissão (com ou sem justa causa) ou pedido de demissão, você tem direito ao 13º salário proporcional aos meses trabalhados no ano. O cálculo é: (salário ÷ 12) × número de meses trabalhados. Considera-se mês trabalhado quando você trabalhou 15 dias ou mais naquele mês."
  },
  
  // Horas Extras
  {
    id: "14",
    category: "Horas Extras",
    question: "Como são calculadas as horas extras?",
    answer: "As horas extras são pagas com acréscimo mínimo de 50% sobre o valor da hora normal. Aos domingos e feriados, o acréscimo é de 100%. Por exemplo: se sua hora normal vale R$ 20,00, a hora extra de segunda a sábado vale R$ 30,00 (50% a mais) e aos domingos/feriados vale R$ 40,00 (100% a mais)."
  },
  {
    id: "15",
    category: "Horas Extras",
    question: "Quantas horas extras posso fazer por dia?",
    answer: "A jornada normal de trabalho é de 8 horas diárias e 44 horas semanais. O limite de horas extras é de 2 horas por dia, totalizando no máximo 10 horas de trabalho diárias. Esse limite pode ser ampliado em casos excepcionais (força maior, serviços inadiáveis, etc)."
  },
  {
    id: "16",
    category: "Horas Extras",
    question: "Banco de horas é legal?",
    answer: "Sim. O banco de horas permite que as horas extras sejam compensadas com folgas ao invés de pagamento em dinheiro. Deve ser estabelecido por acordo coletivo ou convenção coletiva. O prazo para compensação é de até 6 meses (podendo ser ampliado para 1 ano por negociação coletiva). Se não houver compensação no prazo, as horas devem ser pagas como extras."
  },
  
  // Licenças
  {
    id: "17",
    category: "Licenças e Afastamentos",
    question: "Quanto tempo dura a licença-maternidade?",
    answer: "A licença-maternidade tem duração de 120 dias (4 meses) para parto normal ou cesariana. Pode ser estendida para 180 dias (6 meses) se a empresa participar do Programa Empresa Cidadã. Em caso de aborto não criminoso, a licença é de 14 dias. Para adoção, o prazo também é de 120 dias."
  },
  {
    id: "18",
    category: "Licenças e Afastamentos",
    question: "E a licença-paternidade?",
    answer: "A licença-paternidade é de 5 dias corridos, contados a partir do nascimento do filho. Empresas que participam do Programa Empresa Cidadã podem estender para 20 dias. O trabalhador deve solicitar a licença e apresentar a certidão de nascimento."
  },
  {
    id: "19",
    category: "Licenças e Afastamentos",
    question: "Posso ser demitido durante o auxílio-doença?",
    answer: "Sim, mas depende. Se o afastamento foi por acidente de trabalho ou doença ocupacional, você tem estabilidade de 12 meses após o retorno. Se foi por doença comum, não há estabilidade e a demissão é possível, mas a empresa deve pagar todos os direitos rescisórios normalmente."
  },
  
  // Direitos Gerais
  {
    id: "20",
    category: "Direitos Gerais",
    question: "Qual o prazo para receber a rescisão?",
    answer: "O pagamento das verbas rescisórias deve ser feito em até 10 dias corridos após o término do contrato. Se houver atraso, a empresa deve pagar multa equivalente a um salário do empregado. O trabalhador pode cobrar judicialmente os valores em atraso."
  },
  {
    id: "21",
    category: "Direitos Gerais",
    question: "Tenho direito a vale-transporte?",
    answer: "Sim. Todo trabalhador tem direito ao vale-transporte para deslocamento casa-trabalho-casa. A empresa pode descontar até 6% do salário básico. Se o valor do transporte for menor que 6%, desconta-se apenas o valor real. O vale-transporte não tem natureza salarial e não integra a remuneração."
  },
  {
    id: "22",
    category: "Direitos Gerais",
    question: "Quanto tempo tenho para entrar com ação trabalhista?",
    answer: "O prazo para entrar com ação trabalhista (prescrição) é de até 2 anos após o término do contrato de trabalho. Dentro desse prazo, você pode cobrar direitos dos últimos 5 anos de trabalho. Após 2 anos do fim do contrato, você perde o direito de reclamar na Justiça do Trabalho."
  },
  {
    id: "23",
    category: "Direitos Gerais",
    question: "Preciso de advogado para entrar com ação trabalhista?",
    answer: "Para causas de até 2 salários mínimos, não é obrigatório ter advogado. Acima desse valor, é necessário estar acompanhado de advogado. Mesmo não sendo obrigatório, é altamente recomendável ter assistência jurídica para garantir seus direitos e evitar erros processuais."
  },
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-gray-600">
            Tire suas dúvidas sobre direitos trabalhistas
          </p>
        </div>
        <PageNavigation />

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por palavra-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todas
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        {searchTerm && (
          <p className="text-sm text-gray-600 mb-4">
            {filteredFAQ.length} {filteredFAQ.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
        )}

        {/* FAQ Accordion */}
        {filteredFAQ.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredFAQ.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
                  <div className="flex-1 pr-4">
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      {item.category}
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                      {item.question}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-gray-50">
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600">
                Tente buscar com outras palavras-chave ou selecione outra categoria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact CTA */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Não encontrou sua resposta?</CardTitle>
            <CardDescription className="text-blue-100">
              Entre em contato conosco para esclarecer suas dúvidas específicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-50">
              Nossa equipe está pronta para ajudar você com questões trabalhistas específicas do seu caso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
