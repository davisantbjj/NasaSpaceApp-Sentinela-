export const LGPD_URL = 'https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html';

export const PRIVACY_SECTIONS = [
  {
    title: 'O que fica neste navegador',
    text: 'Perfil fictício (nome, função, sexo e início da missão), indicadores acompanhados, plano de medicação, valores e sintomas do check-in, anotações do oficial médico, mensagens, registro de acesso, pedidos de exclusão e preferências. Os valores do check-in, as anotações e o texto das mensagens ficam cifrados. Alertas, correlações e linha de base são calculados a partir dos registros.',
  },
  {
    title: 'Medicação e limites da proteção',
    text: 'O plano de medicação contém nomes e horários previstos. Se vinculado a uma pessoa real, é dado de saúde sensível. Neste protótipo, esse plano fica no cadastro sem criptografia, assim como os dados do perfil e a lista de indicadores. Quem acessa o armazenamento do navegador pode lê-los sem PIN. As marcações diárias de medicação tomada, estresse, carga de trabalho e tempos de exercício ficam cifradas com os demais valores do check-in. Use somente dados fictícios.',
  },
  {
    title: 'Contexto calculado da missão',
    text: 'O perfil e o ambiente da missão ficam nas preferências compartilhadas do aparelho, sem criptografia. A estimativa óssea e a soma das doses registradas de radiação são calculadas na tela, sem criar uma nova medição. A cópia JSON inclui as doses diárias registradas, mas não essas contas nem as preferências compartilhadas da missão. Os dados da demonstração são simulados.',
  },
  {
    title: 'Teste de reação e origem declarada',
    text: 'O check-in pode guardar a média de reação em milissegundos, modo curto ou completo, conclusão, duração, quantidade de respostas válidas e antecipações. Esses dados e a origem declarada dos valores ficam cifrados junto do check-in e aparecem legíveis na cópia JSON. Não guardamos cada toque, gravações ou identificação de aparelhos. Selecionar sensor vestível ou dosímetro apenas informa de onde você copiou o número; o app não lê aparelhos. Metas semanais e avisos de readaptação são calculados na tela, sem diagnóstico.',
  },
  {
    title: 'Para quê',
    text: 'Demonstrar o acompanhamento de indicadores, a comparação com faixas e padrão pessoal e a organização de informações para uma conversa com o oficial médico. Use apenas informações fictícias; este protótipo não presta atendimento de saúde.',
  },
  {
    title: 'Quem consegue ver',
    text: 'Cada pessoa entra com o próprio perfil e PIN. Pelo app, o tripulante vê só os próprios dados; o oficial médico de bordo vê os de todos; o comandante vê só se cada colega fez o check-in e se há alerta vermelho; a equipe médica na Terra recebe um pacote diário cifrado por tripulante. Cada consulta aos seus dados fica registrada em Seus dados. Os seus dados ficam cifrados com uma chave só sua, que abre com o seu PIN e com o do oficial médico; o PIN de um colega não abre. Limites do protótipo: o PIN curto pode ser descoberto por quem copiar o banco, e a chave do solo fica neste mesmo navegador porque tudo roda num aparelho só. Exportar cria um arquivo sob seu controle; abrir fontes externas acessa os respectivos sites.',
  },
  {
    title: 'Por quanto tempo',
    text: 'Os dados de saúde são registro da missão e ficam no dispositivo até a limpeza do navegador ou a recriação da demonstração; os pacotes enviados ficam também com a equipe na Terra. O navegador pode remover o armazenamento. Arquivos JSON já baixados são cópias separadas e precisam ser apagados onde foram salvos.',
  },
  {
    title: 'Base legal e limites do protótipo',
    text: 'Para um serviço real, a LGPD prevê tutela da saúde no art. 11, II, f, exclusivamente em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária. Essa hipótese não é automaticamente aplicável a este demonstrador. Antes de usar dados reais, o responsável deverá definir a base legal e os controles necessários. Continuar aqui apenas registra a leitura deste aviso, não um consentimento genérico para tratar dados de saúde.',
  },
  {
    title: 'Seus direitos',
    text: 'O art. 18 da LGPD prevê direitos como acesso, correção e, nas hipóteses legais, eliminação. A tela Seus dados oferece cópia JSON e o registro de um pedido de exclusão, que fica para a equipe avaliar: o tripulante não apaga o próprio histórico de saúde. Não há promessa de atendimento remoto nem de conformidade integral com a LGPD.',
  },
];
