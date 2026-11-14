# Pesquisa consolidada --- Sentinela

## Monitoramento de saúde de astronautas \| NASA Space Apps Challenge 2026

**Data da pesquisa:** 13 de novembro de 2026\
**Desafio:** [Create Health Monitoring Software for Astronauts on Space
Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)\
**Nome provisório do projeto:** Sentinela

> Este documento reúne a pesquisa e a análise feitas para orientar o
> projeto Sentinela: contexto do desafio, riscos de saúde espacial,
> estudos e tecnologias NASA/CSA, indicadores, fontes de dados,
> arquitetura, concorrência observada, oportunidades de inovação e
> limitações. Os números e faixas usados no protótipo não devem ser
> tratados como parâmetros médicos operacionais.

------------------------------------------------------------------------

# 1. Resumo executivo

O Sentinela é proposto como um aplicativo web de monitoramento de saúde
para missões espaciais longas. O astronauta registra indicadores
diariamente, visualiza o estado dos sistemas do corpo em um painel
interativo e recebe alertas explicáveis com sugestões de ação e
referências científicas.

Três características centrais:

1.  **Linha de base individual:** comparar a evolução do astronauta com
    seu próprio padrão, além de considerar referências gerais e limites
    definidos por equipe médica.
2.  **Alertas explicáveis:** cada alerta informa o que mudou, por que
    isso importa, qual ação é sugerida e qual fonte sustenta a
    informação.
3.  **Operação offline:** manter o aplicativo e as regras disponíveis no
    dispositivo, sem depender de conexão constante com a Terra.

O produto deve ser apresentado como **apoio à decisão e
acompanhamento**, nunca como sistema de diagnóstico ou substituto da
equipe médica. Para o hackathon, os dados de tripulantes são simulados.

## Posicionamento sugerido

> Um sistema autônomo de apoio à decisão que acompanha a evolução
> individual da saúde dos astronautas, identifica alterações relevantes
> em múltiplos indicadores e explica suas recomendações com base em
> evidências científicas, mesmo sem comunicação com a Terra.

------------------------------------------------------------------------

# 2. O desafio NASA Space Apps 2026

O desafio oficial é de dificuldade intermediária e pertence às áreas de
exploração humana, software e exploração espacial.

Missões longas expõem astronautas à radiação espacial, isolamento e
confinamento, gravidade alterada e ambientes fechados/hostis. Esses
fatores podem contribuir para alterações imunológicas, perda óssea,
eventos cardiovasculares e problemas comportamentais. Em missões
distantes, os próprios astronautas precisam perceber mudanças na saúde e
agir com maior autonomia.

O desafio pede um software que reúna indicadores de saúde e permita que
os astronautas avaliem sua condição e tomem ações.

Página oficial: - [Desafio: Create Health Monitoring Software for
Astronauts on Space
Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

A página geral do evento informa: - Hackathon em 14 e 15 de novembro de
2026. - Equipes com até seis participantes. - Submissão de projetos até
15 de novembro, às 23h59 no horário local. - [Página oficial NASA Space
Apps 2026](https://www.spaceappschallenge.org/2026/)

## 2.1 Como o Sentinela responde ao desafio

  -----------------------------------------------------------------------
  Necessidade do desafio              Resposta proposta
  ----------------------------------- -----------------------------------
  Reunir indicadores possíveis de     Check-in de sinais vitais, sono,
  acompanhar em missão                exercício, humor, radiação, visão e
                                      sintomas

  Explicar por que cada medida        Cartões informativos conectados aos
  importa                             riscos estudados pela NASA

  Explicar como os perigos afetam a   Contextualização de radiação,
  saúde                               microgravidade, isolamento,
                                      distância da Terra e ambiente
                                      fechado

  Identificar quando algo pede        Estados verde, amarelo e vermelho,
  atenção                             com regras transparentes

  Orientar ações                      Recomendações vinculadas a
                                      contramedidas e fontes, sempre
                                      sujeitas a protocolos médicos

  Funcionar em missões com            Aplicação offline-first, com
  comunicação limitada                armazenamento e regras locais
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Os cinco perigos do voo espacial humano

A NASA agrupa os principais perigos do voo espacial humano em cinco
categorias. Eles não atuam isoladamente: um perigo pode agravar os
efeitos de outro.

  -----------------------------------------------------------------------
  Perigo                  O que significa         Relevância para o
                                                  Sentinela
  ----------------------- ----------------------- -----------------------
  Radiação espacial       Exposição à radiação    Registrar dose e
                          cósmica e partículas    contexto de exposição,
                          energéticas, com        quando houver dados
                          possibilidade de dano   confiáveis
                          ao DNA e aumento de     
                          risco de câncer         

  Isolamento e            Permanência prolongada  Acompanhar humor, sono,
  confinamento            em grupo pequeno e      bem-estar e fatores de
                          ambiente restrito       equipe

  Distância da Terra      Dificuldade de obter    Justifica autonomia
                          reabastecimento,        local, protocolos
                          instruções e            pré-carregados e
                          atendimento médico;     alertas claros
                          comunicação pode sofrer 
                          atrasos                 

  Campos gravitacionais   Adaptação à             Acompanhar
                          microgravidade,         condicionamento,
                          gravidade               equilíbrio, sistema
                          lunar/marciana e        cardiovascular, ossos e
                          retorno à gravidade     visão
                          terrestre               

  Ambientes               Controle de             Acompanhar sintomas,
  fechados/hostis         temperatura, pressão,   sono, imunidade e
                          iluminação, ruído e     contexto ambiental
                          microrganismos em uma   
                          nave que também é casa  
  -----------------------------------------------------------------------

Referência: - [NASA --- 5 Hazards of Human
Spaceflight](https://www.nasa.gov/hrp/hazards/)

## 3.1 Números de contexto destacados nas fontes

-   Marte fica, em média, a aproximadamente 225 milhões de quilômetros
    da Terra.
-   Uma viagem à Lua leva aproximadamente três dias.
-   Uma missão a Marte pode durar cerca de três anos.
-   A gravidade de Marte é aproximadamente 3/8 da gravidade terrestre.
-   A comunicação com Marte pode ter atraso de até cerca de 20 minutos
    em cada sentido.
-   O habitat HERA, usado em estudos análogos, tem cerca de 60 m².
-   O CHAPEA simula missões de um ano com quatro participantes em um
    habitat de aproximadamente 158 m².

Esses números servem para explicar o contexto de exploração e autonomia.
Não são limites médicos nem parâmetros de alerta do aplicativo.

------------------------------------------------------------------------

# 4. Os 17 riscos de saúde estudados pela NASA

O Human Research Program (HRP) da NASA organiza 17 riscos em três
grupos: 11 fisiológicos, cinco de comportamento/fatores humanos e um de
radiação.

## 4.1 Riscos fisiológicos (11)

  --------------------------------------------------------------------------
  Risco                      Descrição resumida      Relação possível com
                                                     indicadores
  -------------------------- ----------------------- -----------------------
  Alterações na resposta do  Estresse do voo pode    Temperatura, sintomas,
  sistema imunológico        alterar a resposta      exames laboratoriais
                             imune e reativar vírus  quando disponíveis
                             dormentes               

  Alterações                 Enjoo, tontura e        Sintomas, equilíbrio e
  sensório-motoras e         coordenação prejudicada testes sensório-motores
  vestibulares               durante adaptação à     
                             gravidade               

  Adaptações                 Microgravidade altera   Frequência cardíaca,
  cardiovasculares           circulação e            pressão arterial e
                             funcionamento do        avaliações médicas
                             coração e vasos         

  Doença descompressiva      Formação de bolhas de   Procedimentos e
                             nitrogênio na transição monitoramento médico
                             entre ambientes         específico
                             pressurizados           

  Interação                  Mudanças no microbioma  Sintomas, amostras e
  hospedeiro-microrganismo   da pele e intestino     análises laboratoriais
                             podem alterar riscos    
                             infecciosos             

  Hipóxia                    Risco de oxigenação     Oxigenação e avaliação
                             insuficiente em         clínica, quando medidas
                             determinados            
                             procedimentos e         
                             ambientes               

  Alimentação e nutrição     Dieta equilibrada é     Alimentação, ingestão e
  inadequadas                essencial em missões    dados nutricionais
                             longas                  

  Lesões e queda de          Fadiga, lesões e riscos Sintomas, fadiga e
  desempenho em caminhadas   fisiológicos durante    avaliação de desempenho
  espaciais                  atividades              
                             extraveiculares         

  Redução do condicionamento Perda de capacidade     Exercício, força e
  cardiorrespiratório e      cardiovascular, força e testes físicos
  musculoesquelético         desempenho muscular     

  Síndrome Neuro-Ocular      Alterações no olho e em Sintomas visuais e
  Associada ao Voo Espacial  estruturas relacionadas exames oftalmológicos
  (SANS)                     durante o voo           

  Alterações ósseas          Perda de densidade      Exercício, nutrição e
  induzidas pelo voo         óssea e aumento de      exames específicos
                             fragilidade             
  --------------------------------------------------------------------------

## 4.2 Riscos comportamentais e fatores humanos (5)

  -----------------------------------------------------------------------
  Risco                   Descrição resumida      Relação possível com
                                                  indicadores
  ----------------------- ----------------------- -----------------------
  Mudanças                Isolamento, estresse e  Humor, sono,
  comportamentais e       outros fatores podem    autorrelato e
  transtornos             afetar a saúde mental   acompanhamento
  psiquiátricos                                   profissional

  Trabalho em equipe      Comunicação e           Registros de bem-estar
  inadequado              coordenação da equipe   e fatores humanos, com
                          são essenciais          cuidado para não
                                                  reduzir relações
                                                  complexas a uma nota

  Sono inadequado e       Privação de sono, carga Duração e qualidade do
  horários irregulares    de trabalho e relógio   sono
                          biológico desregulado   

  Suporte inadequado à    Falhas inesperadas      Contexto operacional,
  operação de sistemas    exigem treinamento,     não um sinal vital
                          informação e suporte    

  Lesões por cargas       Risco de lesão em fases Sintomas e avaliação
  dinâmicas               de pouso e outras       médica
                          cargas                  
  -----------------------------------------------------------------------

## 4.3 Risco de radiação (1)

  -----------------------------------------------------------------------
  Risco                   Descrição resumida      Relação possível com
                                                  indicadores
  ----------------------- ----------------------- -----------------------
  Câncer induzido por     Exposição à radiação    Dose acumulada, dose
  radiação                espacial pode aumentar  por período e histórico
                          o risco de câncer       de exposição

  -----------------------------------------------------------------------

Referências: - [NASA --- Risks of Human
Spaceflight](https://www.nasa.gov/hrp/risks/) - [NASA --- Human Research
Program](https://www.nasa.gov/hrp/)

**Observação:** a relação entre indicadores e riscos na tabela é uma
organização funcional para o protótipo. Não representa uma classificação
clínica oficial da NASA.

------------------------------------------------------------------------

# 5. Pesquisas e programas da NASA relevantes

## 5.1 Human Research Program (HRP)

O HRP estuda os efeitos do voo espacial sobre o corpo e o comportamento
humano e desenvolve contramedidas para reduzir riscos. Suas áreas
incluem visão, ossos, músculos, coluna, imunidade, microbiologia,
prontidão após pouso, nutrição, desorientação e radiação.

Páginas: - [Human Research Program](https://www.nasa.gov/hrp/) - [Human
Health
Countermeasures](https://www.nasa.gov/hrp/human-health-countermeasures/) -
[Human Factors and Behavioral
Performance](https://www.nasa.gov/hrp/human-factors-and-behavioral-performance/) -
[Space Radiation Element](https://www.nasa.gov/hrp/radiation/) -
[Research Operations &
Integration](https://www.nasa.gov/hrp/research-operations-integration/)

## 5.2 ARCHeR

O ARCHeR acompanha bem-estar, atividade e sono para entender saúde e
desempenho em missões de exploração. Inclui medidas de atividade e
questionários comportamentais, com coleta antes e depois da missão e
actigrafia durante a missão.

Aplicação ao Sentinela: - Diário de sono e bem-estar. - Tendências
individuais. - Acompanhamento longitudinal, não apenas uma medição
isolada.

Referência: - [NASA --- Ongoing HRP
Research](https://www.nasa.gov/hrp/ongoing-hrp-research/)

## 5.3 Standard Measures

O programa Standard Measures reúne um conjunto padronizado de medidas
para estudar a saúde dos astronautas. Entre as medidas citadas estão: -
Atividade e exposição à luz com sensor de pulso. - Relatos de sono. -
Amostras de fluidos relacionadas à nutrição. - Saliva para estudar
imunidade. - Testes cognitivos. - Testes sensório-motores. - Avaliação
de força corporal. - Amostras fecais para estudos do microbioma.

Aplicação ao Sentinela: - Fundamenta a importância de sono, atividade,
cognição, imunidade e medidas longitudinais. - Mostra que monitoramento
de saúde espacial envolve muito mais que frequência cardíaca e pressão
arterial.

Referência: - [NASA --- Standard
Measures](https://www.nasa.gov/reference/standard-measures/)

## 5.4 Estudos e linhas de pesquisa adicionais

A pesquisa NASA também lista estudos relacionados a: - Biomarcadores
imunológicos. - Pressão de fluidos cerebrais e alterações
neuro-oculares. - Saúde da coluna e dos ossos. - Exercício em missões de
exploração. - Adaptação vestibular e sensório-motora. - Nutrição e
aceitação dos alimentos. - Saúde vascular e fluxo sanguíneo. -
Desempenho cognitivo e fatores humanos. - Amostras biológicas e análises
ômicas.

Referência central: - [NASA --- Ongoing HRP Research in
Space](https://www.nasa.gov/hrp/ongoing-hrp-research/)

------------------------------------------------------------------------

# 6. Tecnologias e pesquisas da Agência Espacial Canadense (CSA)

## 6.1 Bio-Monitor

O Bio-Monitor é uma tecnologia vestível canadense descrita como uma
camiseta inteligente, associada a sensores e uma interface de coleta. A
documentação da CSA relaciona seu uso ao monitoramento de parâmetros
como: - Frequência cardíaca e atividade elétrica cardíaca. - Pressão
arterial. - Frequência e volume respiratório. - Temperatura da pele. -
Saturação de oxigênio (SpO₂). - Atividade física.

Os dados podem ser transmitidos para equipes em solo na infraestrutura
da ISS.

**Limitação para integração:** não foi identificada, na pesquisa
realizada, uma API pública que permita ao Sentinela consumir diretamente
a telemetria do Bio-Monitor. Portanto, o projeto deve descrevê-lo como
referência tecnológica real, não como integração já disponível.

Referências: - [CSA --- Testing
Technologies](https://www.asc-csa.gc.ca/eng/iss/testing-technologies.asp) -
[CSA --- Why do we conduct science experiments in
space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)

## 6.2 Radi-N e Radi-N2

O Radi-N2 é um experimento canadense de medição de nêutrons na ISS.
Utiliza detectores de bolhas: pequenos tubos com gel de polímero e
gotículas. Quando um nêutron atinge uma gotícula, ela vaporiza e forma
uma bolha que pode ser contada.

A pesquisa descreve: - Uso de oito detectores em determinados
protocolos: seis em locais fixos, um junto ao corpo e um no
alojamento. - Período de coleta de sete dias. - Dose de nêutrons
observada em torno de 150 microsieverts por dia no contexto descrito. -
Dose menor nos alojamentos de dormir em comparação com outras áreas
observadas.

**Cuidado:** 150 µSv/dia é uma medição contextual de nêutrons relatada
para a ISS. Não é limite universal de segurança, não equivale à dose
total de radiação e não deve ser usado como faixa verde para uma missão
lunar ou marciana.

Referência: - [CSA ---
Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp)

## 6.3 CANS

O Canadian Active Neutron Spectrometer (CANS) é um instrumento compacto
e autônomo para monitorar nêutrons continuamente na ISS. A CSA informou
que nêutrons representam aproximadamente 30% da radiação na estação. Em
26 de fevereiro de 2026, foi divulgado contrato de CAD 5,5 milhões
relacionado ao desenvolvimento/fornecimento do sistema.

**Limitação para integração:** não foi localizado um feed público de
medições do CANS para integração direta no protótipo.

Referências: - [CSA --- Monitoring radiation for astronaut
health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) -
[CSA --- Experiments on the
ISS](https://www.asc-csa.gc.ca/eng/iss/science/experiments.asp)

## 6.4 Outros experimentos canadenses citados

A CSA lista experimentos e tecnologias ligados a: - AstroFit: força. -
SPARK: anemia. - HomeBase: orientação em ausência de gravidade. -
SANSORI/SANSORI-2: visão. - C-STARS: bem-estar mental. - CARDIOBREATH:
sistema cardiovascular e respiração. - TBone/TBone2: saúde óssea. -
Wayfinding: cérebro e orientação. - Vascular Aging e Vascular Calcium:
saúde vascular.

Referência: - [CSA --- Experiments on the
ISS](https://www.asc-csa.gc.ca/eng/iss/science/experiments.asp)

------------------------------------------------------------------------

# 7. Dados e APIs que podem ser usados

## 7.1 NASA Open Science Data Repository (OSDR)

O OSDR é um repositório de dados de biologia espacial e pesquisas
relacionadas. Reúne diferentes tipos de dados e metadados, incluindo: -
Dados ômicos. - Dados fenotípicos, fisiológicos e comportamentais. -
Dados biomédicos e de bioimagem. - Telemetria ambiental. - Dados de
hardware. - Dados de humanos, animais, plantas, microrganismos e modelos
biológicos.

O OSDR oferece mecanismos de busca e APIs para recuperar metadados,
localizar arquivos e consultar estudos.

Referências: - [NASA ---
OSDR](https://science.nasa.gov/biological-physical/data/osdr/) - [NASA
--- OSDR API](https://www.nasa.gov/osdr-api/) - [NASA --- Open APIs /
OSDR Public API](https://api.nasa.gov/) - [OSDR Biological Data
API](https://visualization.osdr.nasa.gov/biodata/api/)

### O que a API permite

-   Pesquisar estudos por termos e metadados.
-   Consultar metadados de estudos.
-   Localizar arquivos associados a estudos.
-   Consultar metadados de missões, experimentos, veículos, hardware,
    payloads, sujeitos e biospecimens.
-   Filtrar conjuntos de dados por características como organismo,
    tecido e tipo de ensaio, conforme a API.

### O que ela não deve ser apresentada como

A OSDR **não é um feed de sinais vitais operacionais em tempo real** da
tripulação. É um repositório científico para consulta e análise de dados
e metadados de estudos. Não se deve prometer que o Sentinela vai buscar
automaticamente a frequência cardíaca atual de astronautas por essa API.

### Acesso e privacidade

A NASA informa que grande parte dos dados do OSDR é acessível
publicamente. Entretanto, certos dados humanos, especialmente dados de
sequência, podem ter acesso controlado e exigir solicitação. Não se deve
presumir que todos os registros individuais de astronautas sejam
abertos.

Referências: - [NASA --- OSDR
FAQ](https://science.nasa.gov/reference/osdr-faq/) - [NASA --- OSDR
API](https://www.nasa.gov/osdr-api/)

## 7.2 Estratégia prática para o hackathon

Para a demonstração: 1. Criar dados fictícios de astronautas. 2.
Documentar quais pesquisas e conjuntos científicos fundamentam cada
indicador. 3. Usar links para fontes oficiais em cada cartão de
explicação. 4. Se houver tempo, demonstrar uma consulta à OSDR para
localizar estudos ou metadados, sem fingir que isso fornece sinais
vitais em tempo real.

------------------------------------------------------------------------

# 8. Os dez indicadores propostos para o Sentinela

A proposta original organiza dez indicadores. As faixas abaixo foram
pensadas para demonstração e vieram de referências gerais de adultos,
não de limites operacionais validados para astronautas.

  ----------------------------------------------------------------------------------------
  Indicador      Entrada        Referência      Risco relacionado     Ação ilustrativa
                 proposta       demonstrativa                         
                                inicial                               
  -------------- -------------- --------------- --------------------- --------------------
  Pressão        Valor digitado Próximo de      Adaptações            Repetir medição e
  arterial       em mmHg        120/80;         cardiovasculares      seguir protocolo
                                observar quedas                       médico;
                                importantes                           hidratação/medidas
                                                                      específicas apenas
                                                                      se prescritas

  Frequência     Valor digitado 60--100 bpm em  Adaptações            Repetir medida após
  cardíaca       em bpm         repouso, como   cardiovasculares      repouso e comunicar
                                referência                            alteração
                                geral                                 persistente

  Glicemia       Valor digitado 70--99 mg/dL em Alimentação e         Registrar contexto
                 em mg/dL       jejum,          nutrição              da refeição e
                                referência                            repetir conforme
                                geral                                 protocolo

  Temperatura    Valor digitado 36,1--37,2 °C,  Resposta imunológica  Observar sintomas e
                 em °C          referência                            seguir protocolo
                                geral                                 médico

  Sono           Horas por dia  7--9 horas como Sono                  Proteger horário de
                 e, se          referência      inadequado/horários   descanso e ajustar
                 possível,      geral de        irregulares           luz/rotina conforme
                 qualidade      adultos                               protocolo

  Humor          Escala de 1 a  Tendência       Mudanças              Diário, suporte da
                 5              pessoal, não um comportamentais       equipe e contato
                                corte clínico                         conforme rotina da
                                                                      missão

  Exercício      Minutos por    Rotina de       Condicionamento e     Registrar
                 dia e tipo     exercício da    saúde óssea           modalidade, duração
                                ISS como                              e cumprimento do
                                contexto, não                         plano individual
                                meta universal                        

  Radiação       Dose por       Comparar com    Câncer induzido por   Seguir orientação de
                 período, em    histórico e     radiação              abrigo/área
                 unidade        limites                               protegida e
                 claramente     oficiais da                           protocolo de
                 indicada       missão                                radiação

  Visão          Autoteste      Mudança em      SANS                  Registrar sintomas e
                 simples e      relação ao                            encaminhar para
                 sintomas       padrão                                avaliação
                                individual                            oftalmológica

  Sintomas       Lista          Ausência ou     Diversos riscos       Orientação depende
                 estruturada e  presença e                            do sintoma e da
                 texto livre    evolução                              gravidade
  ----------------------------------------------------------------------------------------

## 8.1 Advertências obrigatórias sobre as faixas

-   120/80, 60--100 bpm, 70--99 mg/dL, 36,1--37,2 °C e 7--9 horas são
    referências gerais, não limites médicos espaciais.
-   A pressão arterial e a frequência cardíaca podem variar com o
    contexto fisiológico da missão.
-   A glicemia não deve ser tratada como medição diária obrigatória de
    todo astronauta sem justificativa clínica e operacional.
-   O humor não deve ser reduzido a um diagnóstico ou a uma
    classificação simplista.
-   Os 90 minutos de exercício frequentemente citados no contexto da ISS
    não devem ser tratados como meta universal rígida para qualquer
    missão ou pessoa.
-   Um autoteste visual não diagnostica SANS.
-   A radiação deve ser interpretada com unidade, período, tipo de
    radiação, instrumento e contexto da missão. Dose de nêutrons não é
    sinônimo de dose total.

## 8.2 Linha de base individual

A proposta original considera os primeiros sete dias como linha de base
e sugere que um desvio mantido por três dias gere alerta amarelo.

Isso é uma **regra de protótipo**, não uma regra clínica validada. Há
riscos: - Os primeiros sete dias podem não representar um estado
estável. - Um astronauta pode iniciar o período de referência já com
alteração. - Um desvio persistente pode ser importante antes de
completar três dias. - Um indicador pode oscilar naturalmente. - Um
valor dentro da faixa geral pode ser incomum para aquela pessoa, e
vice-versa.

Melhoria recomendada: - Combinar linha de base individual, limites
absolutos de segurança aprovados, tendência temporal e contexto da
missão. - Permitir que a equipe médica configure os limites. - Não usar
a linha de base para normalizar uma situação potencialmente perigosa. -
Exibir quantidade e qualidade dos dados usados para formar a linha de
base.

------------------------------------------------------------------------

# 9. Funcionalidades e experiência do usuário

## 9.1 Telas principais

  -----------------------------------------------------------------------
  Tela                    Conteúdo                Prioridade
  ----------------------- ----------------------- -----------------------
  Painel corporal         Silhueta humana com     Essencial
                          regiões clicáveis e     
                          estado do pior          
                          indicador associado     

  Check-in diário         Formulário guiado, um   Essencial
                          indicador por etapa,    
                          com instruções          

  Alertas e ações         Lista por gravidade;    Essencial
                          mudança, explicação,    
                          ação e fonte            

  Tendências              Gráficos temporais e    Desejável
                          linha de base pessoal   

  Missão e rotina         Ambiente da missão,     Desejável
                          lembretes e sequência   
                          de registros            
  -----------------------------------------------------------------------

## 9.2 Corpo humano interativo

Regiões sugeridas: - Cabeça e olhos. - Coração e circulação. - Ossos e
músculos. - Sistema imune. - Mente e bem-estar.

Cada região deve mostrar: - Indicadores associados. - Estado atual. -
Tendência. - Motivo de eventual alerta. - Fonte científica. - Ação
recomendada ou encaminhamento.

A cor da região pode refletir o pior alerta associado, mas o usuário
deve conseguir abrir o detalhe e entender exatamente qual indicador
gerou a classificação.

## 9.3 Níveis de alerta

  -----------------------------------------------------------------------
  Nível                   Significado proposto    Comportamento do
                                                  sistema
  ----------------------- ----------------------- -----------------------
  Verde                   Sem alteração relevante Exibir acompanhamento
                          detectada pelas regras  normal e dados recentes
                          do protótipo            

  Amarelo                 Mudança ou tendência    Explicar o desvio,
                          que merece              sugerir nova
                          acompanhamento          medição/observação e
                                                  orientar comunicação
                                                  conforme protocolo

  Vermelho                Condição que, segundo   Exibir instrução de
                          regra previamente       emergência aprovada e
                          aprovada, exige ação    orientar contato com
                          imediata                equipe médica
  -----------------------------------------------------------------------

**Atenção:** as cores só terão significado operacional se as regras
forem validadas por profissionais e autoridades médicas da missão. No
protótipo, devem ser identificadas como simulação.

## 9.4 Conteúdo de cada alerta

Cada alerta deve responder: 1. O que mudou? 2. Em relação a qual
referência? 3. Por que isso importa? 4. Qual é a incerteza ou limitação
da medição? 5. O que fazer agora, segundo o protocolo? 6. Quando e como
comunicar a equipe médica? 7. Qual fonte científica sustenta a
explicação?

## 9.5 Contexto da missão

A interface pode oferecer contextos como: - Estação espacial. - Trânsito
para a Lua. - Superfície lunar. - Trânsito para Marte. - Superfície
marciana.

O contexto altera a explicação e a relevância dos fatores, mas não deve
inventar limites médicos diferentes sem base científica e validação.

------------------------------------------------------------------------

# 10. Arquitetura e tecnologias recomendadas

A proposta é uma aplicação web que funcione no próprio dispositivo.

  -----------------------------------------------------------------------
  Camada                  Tecnologia sugerida     Responsabilidade
  ----------------------- ----------------------- -----------------------
  Interface               React + TypeScript +    Telas, navegação e
                          Vite                    estado

  Visualização corporal   SVG                     Silhueta e regiões
                                                  clicáveis

  Gráficos                Recharts                Tendências e linha de
                                                  base

  Armazenamento local     IndexedDB               Registros e dados
                                                  simulados

  Regras                  TypeScript + JSON       Limites, condições,
                                                  mensagens e fontes

  Offline                 PWA + Service Worker    Carregamento e
                                                  funcionamento sem rede

  Publicação              Vercel ou GitHub Pages  Demonstração pública
  -----------------------------------------------------------------------

## 10.1 Fluxo lógico

1.  O astronauta preenche o check-in.
2.  O aplicativo valida os campos e registra horário/contexto.
3.  Os dados são salvos localmente.
4.  O motor de regras avalia referência geral, linha de base, tendência
    e contexto.
5.  O painel atualiza o estado visual.
6.  Os alertas explicam a regra acionada e apresentam a fonte.
7.  Os gráficos mostram a evolução.

## 10.2 Segurança e privacidade

-   IndexedDB não criptografa automaticamente os dados.
-   Usar criptografia adequada para dados locais sensíveis, com gestão
    de chaves coerente com o cenário.
-   Implementar bloqueio de sessão e controle de acesso.
-   Evitar armazenar dados pessoais desnecessários.
-   Registrar alterações relevantes e origem dos dados.
-   Separar dados simulados, dados importados e dados reais.
-   Definir estratégia de backup e sincronização quando houver conexão.
-   Não transmitir dados de saúde sem autenticação, autorização e
    proteção adequadas.

## 10.3 Por que não começar com IA?

Para um protótipo de 48 horas, um motor de regras transparente é mais
simples de testar e explicar. Uma IA pode produzir recomendações
difíceis de auditar ou inconsistentes. O valor central do projeto é a
explicabilidade, a autonomia offline e o vínculo entre alerta e
evidência.

Uma evolução futura poderia usar modelos locais para resumir tendências,
desde que: - Não façam diagnóstico. - Não inventem recomendações. -
Mostrem a origem dos dados. - Permitam auditoria. - Não substituam
regras de segurança determinísticas.

------------------------------------------------------------------------

# 11. Inovação e diferenciação

A pesquisa de equipes inscritas mostra que há propostas semelhantes de
monitoramento de saúde. Portanto, o diferencial não deve ser apenas "um
painel com sinais vitais".

## 11.1 Diferenciais com potencial

### A. Linha de base individual contextualizada

Comparar o astronauta consigo mesmo, sem abandonar limites absolutos e
protocolos médicos.

### B. Alertas explicáveis

Cada alerta mostra a regra, a mudança, a fonte, a incerteza e a ação.

### C. Correlação entre indicadores

Exibir coincidências temporais, por exemplo, mudança no sono acompanhada
de mudança no humor. O sistema não deve afirmar causalidade ou
diagnóstico.

### D. Operação offline

O aplicativo deve continuar útil sem comunicação com a Terra, com dados
e protocolos previamente carregados.

### E. Contexto da missão

A interface explica como os riscos variam entre ISS, trânsito, Lua e
Marte, sem inventar parâmetros médicos.

### F. Transparência sobre confiança

Mostrar quando há poucos dados, dados ausentes, medição manual ou uma
fonte de baixa aplicabilidade ao contexto.

## 11.2 Diferencial de apresentação

A demonstração pode começar com um painel normal e, ao longo de alguns
dias simulados: - Sono piora. - Humor muda. - O sistema identifica uma
tendência. - O painel destaca a região correspondente. - O alerta
explica o motivo, a fonte e a ação. - A interface continua funcionando
em modo offline.

------------------------------------------------------------------------

# 12. Pesquisa de equipes com propostas semelhantes

A pesquisa pública de equipes inscritas no desafio encontrou descrições
que indicam temas próximos. Isso não comprova que as equipes tenham um
protótipo funcional ou que tenham implementado todas as funcionalidades
anunciadas.

  ---------------------------------------------------------------------------------
  Equipe/projeto          O que a descrição pública informa Observação
  ----------------------- --------------------------------- -----------------------
  ASTRAHEALTH ---         Solução offline-first, IA local,  Sobreposição com
  Realigns Inc            visualização de dados,            offline e privacidade
                          privacidade e sistemas            
                          resilientes                       

  ASTRIVA                 Descrição relacionada a IA e      Perfil público não
                          análise de dados                  prova implementação

  Astro Minds             Monitoramento, análise de         Sobreposição com painel
                          parâmetros, riscos, alertas e IA  e alertas

  neurOrbit               Foco                              Relevante para humor,
                          psicológico/neurocomportamental   sono e fatores humanos

  AstroGuard AI           Sistema de alerta antecipado      Sobreposição com early
                                                            warning

  AstroCare               Proposta de monitoramento de      Descrição pública deve
                          saúde                             ser lida com cautela
  ---------------------------------------------------------------------------------

Equipe com página pública identificada: - [Realigns Inc ---
ASTRAHEALTH](https://www.spaceappschallenge.org/2026/find-a-team/realigns-inc-astrahealth/)

**Limitação da pesquisa:** as páginas consultadas são descrições de
equipes e intenções declaradas. Não permitem avaliar qualidade técnica,
resultados, precisão ou funcionalidades concluídas. Não se deve afirmar
que uma equipe já construiu algo sem evidência pública verificável.

------------------------------------------------------------------------

# 13. Avaliação crítica: riscos e pontos que precisam ser corrigidos

## 13.1 Faixas clínicas não validadas

As faixas do protótipo vêm de referências gerais para adultos. Elas não
foram validadas como limites de saúde para astronautas em microgravidade
ou em missões de exploração.

**Ação:** identificar cada faixa como demonstrativa e não operacional.
Para uso real, seriam necessários protocolos e validação médica.

## 13.2 Linha de base arbitrária

Sete dias de referência e três dias para acionar amarelo são decisões de
protótipo, não regras comprovadas.

**Ação:** permitir configuração, exigir dados mínimos, avaliar qualidade
da linha de base e manter limites de segurança independentes.

## 13.3 Risco de falsos positivos e falsos negativos

Um alerta excessivo pode gerar fadiga de alertas. Um alerta tardio pode
deixar passar uma condição importante.

**Ação:** testar regras com cenários simulados, registrar por que cada
regra foi acionada e avaliar sensibilidade/especificidade quando houver
dados adequados.

## 13.4 Recomendações genéricas

Hidratação, exercício, descanso ou isolamento não são recomendações
universais para qualquer alteração.

**Ação:** atrelar a ação a um protocolo aprovado, gravidade, contexto e
tipo de indicador. Quando não houver protocolo, orientar contato com
equipe médica, sem improvisar tratamento.

## 13.5 Radiação

A medição Radi-N2 de aproximadamente 150 µSv/dia diz respeito a nêutrons
no contexto estudado na ISS. Não deve ser usada como limite universal
nem como dose total.

**Ação:** mostrar tipo de radiação, unidade, período, instrumento e
contexto. Preferir dados oficiais da missão.

## 13.6 Visão e SANS

Autotestes simples não diagnosticam SANS, que exige avaliação
especializada.

**Ação:** usar autorrelato de sintomas e encaminhamento para exames, sem
classificar doença.

## 13.7 Integração com sensores

Bio-Monitor e CANS são referências reais, mas a pesquisa não encontrou
APIs públicas para consumir diretamente suas medições.

**Ação:** no hackathon, usar entrada manual e dados simulados,
descrevendo claramente a integração como possibilidade futura.

## 13.8 Privacidade

Armazenamento local não significa armazenamento seguro.

**Ação:** explicar criptografia, controle de acesso, minimização de
dados e política de sincronização.

------------------------------------------------------------------------

# 14. Priorização para o hackathon

## P0 --- obrigatório para uma demonstração coerente

-   Check-in diário.
-   Dados simulados de pelo menos três tripulantes.
-   Dez indicadores apresentados com limitações claras.
-   Motor de regras simples.
-   Alertas verde/amarelo/vermelho demonstrativos.
-   Painel corporal clicável ou cartões por sistema.
-   Fonte científica em cada explicação.
-   Funcionamento offline básico.

## P1 --- melhora bastante o projeto

-   Linha de base individual.
-   Gráficos de tendência.
-   Contexto da missão.
-   Explicação de confiança/qualidade dos dados.
-   Correlação temporal sem alegar causalidade.

## P2 --- evolução futura

-   Integração com sensores reais.
-   Sincronização segura com equipe em solo.
-   Consulta automatizada a repositórios científicos.
-   Modelos locais para sumarização, com auditoria.

## Plano de execução em 48 horas

  -----------------------------------------------------------------------
  Período                             Entrega
  ----------------------------------- -----------------------------------
  Sábado de manhã                     Criar projeto, publicar versão
                                      inicial, definir modelo de dados,
                                      regras e dados simulados

  Sábado à tarde                      Check-in persistente e motor de
                                      regras

  Sábado à noite                      Painel corporal e alertas

  Domingo de manhã                    Gráficos, linha de base e contexto
                                      da missão

  Domingo à tarde                     Lembretes, teste offline, revisão
                                      de fontes e textos

  Domingo --- últimas horas           Gravar demonstração, revisar página
                                      do projeto e enviar
  -----------------------------------------------------------------------

## Roteiro de demonstração de aproximadamente um minuto

1.  Abrir o painel com todos os indicadores em estado normal.
2.  Selecionar um astronauta fictício.
3.  Mostrar a evolução de sono e humor em alguns dias simulados.
4.  Exibir o alerta amarelo e abrir sua explicação.
5.  Mostrar a fonte científica, a regra acionada e a ação recomendada.
6.  Desconectar a rede e demonstrar que o painel continua acessível.

------------------------------------------------------------------------

# 15. Critérios de avaliação e apresentação

A pesquisa anterior identificou referências a dimensões como impacto,
criatividade, validade, relevância e apresentação. A página de critérios
localizada durante a pesquisa não deve ser confundida com uma rubrica
oficial de 2026 se o documento aplicável ao evento não confirmar isso.

Para fortalecer a apresentação, o Sentinela deve demonstrar: -
**Impacto:** como ajuda a tripulação a reconhecer mudanças de saúde em
missões longas. - **Criatividade:** linha de base individual, painel
corporal e alertas explicáveis. - **Validade:** fontes NASA/CSA, limites
declarados e ausência de alegações médicas indevidas. - **Relevância:**
resposta direta ao desafio oficial. - **Apresentação:** demonstração
curta, fluxo claro e links funcionando.

Referência de orientação de julgamento localizada: - [NASA Space Apps
--- Judging Instructional Guidance 2025
(PDF)](https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf)

**Atenção:** esse PDF é de 2025 e serve apenas como referência
histórica. Confirmar a rubrica e as regras oficiais específicas de 2026
antes da submissão.

------------------------------------------------------------------------

# 16. Fontes consultadas

## 16.1 NASA --- desafio e contexto

-   [Create Health Monitoring Software for Astronauts on Space Missions
    --- Space Apps
    2026](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
-   [NASA Space Apps Challenge
    2026](https://www.spaceappschallenge.org/2026/)
-   [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)
-   [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/)
-   [Ongoing HRP Research in
    Space](https://www.nasa.gov/hrp/ongoing-hrp-research/)
-   [Human Factors and Behavioral
    Performance](https://www.nasa.gov/hrp/human-factors-and-behavioral-performance/)
-   [Human Health
    Countermeasures](https://www.nasa.gov/hrp/human-health-countermeasures/)
-   [Space Radiation Element](https://www.nasa.gov/hrp/radiation/)
-   [Research Operations &
    Integration](https://www.nasa.gov/hrp/research-operations-integration/)

## 16.2 NASA --- estudos e riscos específicos

-   [Standard
    Measures](https://www.nasa.gov/reference/standard-measures/)
-   [Hazard: Distance from
    Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/)
-   [Risk of Spaceflight-Induced Bone
    Changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/)
-   [Risk of
    SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)
-   [Risk from Inadequate Sleep and Irregular
    Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/)
-   [Risk of Reduced Cardiorespiratory and Musculoskeletal
    Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)

## 16.3 NASA --- dados e APIs

-   [NASA Open Science Data
    Repository](https://science.nasa.gov/biological-physical/data/osdr/)
-   [NASA OSDR API](https://www.nasa.gov/osdr-api/)
-   [NASA Open APIs --- OSDR Public API](https://api.nasa.gov/)
-   [OSDR Biological Data
    API](https://visualization.osdr.nasa.gov/biodata/api/)
-   [OSDR FAQ](https://science.nasa.gov/reference/osdr-faq/)

## 16.4 Agência Espacial Canadense (CSA)

-   [Monitoring radiation for astronaut
    health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
-   [Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp)
-   [Testing
    Technologies](https://www.asc-csa.gc.ca/eng/iss/testing-technologies.asp)
-   [Experiments on the
    ISS](https://www.asc-csa.gc.ca/eng/iss/science/experiments.asp)
-   [Why do we conduct science experiments in
    space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
-   [MOSFET](https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp)
-   [EVARM](https://www.asc-csa.gc.ca/eng/iss/evarm.asp)

## 16.5 Concorrência observada

-   [Realigns Inc ---
    ASTRAHEALTH](https://www.spaceappschallenge.org/2026/find-a-team/realigns-inc-astrahealth/)

As demais equipes citadas na análise foram encontradas em páginas
públicas de equipes inscritas no desafio. Suas descrições devem ser
tratadas como intenções declaradas, não como validação de produto
entregue.

------------------------------------------------------------------------

# 17. Conclusão

O Sentinela tem aderência ao desafio porque enfrenta uma necessidade
real da exploração humana: acompanhar a saúde em missões longas, com
autonomia crescente e comunicação limitada.

O melhor caminho para diferenciá-lo é não competir apenas como mais um
painel de sinais vitais. O projeto deve destacar: 1. Evolução individual
e tendências. 2. Alertas que explicam sua própria lógica. 3. Conexão
explícita com evidências NASA/CSA. 4. Operação offline. 5. Transparência
sobre incerteza, limites e ausência de diagnóstico.

O protótipo será mais convincente se demonstrar poucas funções de ponta
a ponta, com fontes e limitações bem explicadas, em vez de prometer
integração com sensores ou inteligência artificial que não estejam
realmente implementadas.

------------------------------------------------------------------------

## Nota de escopo

Este documento consolida a pesquisa e as análises feitas para a conversa
sobre o Sentinela. Ele não substitui os documentos originais de pesquisa
nem a leitura das páginas oficiais. Links, APIs, regras do evento e
informações de equipes podem mudar; conferir as fontes oficiais antes de
submeter o projeto.
