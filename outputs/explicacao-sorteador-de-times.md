# Explicação do Sorteador de times

## Visão geral

A aplicação é um sorteador de times com interface web, modo claro/escuro, configuração de participantes e times, persistência de sorteios e área administrativa protegida.

## Organização dos arquivos

- `sorteio-times.html`: estrutura da interface principal e formulário de login administrativo.
- `historico-sorteios.html`: estrutura da página administrativa de histórico.
- `assets/css/sorteio-times.css`: estilos da página principal.
- `assets/css/historico-sorteios.css`: estilos da página de histórico.
- `assets/js/sorteio-times.js`: lógica de participantes, times, sorteio, alternância de tema, login e envio dos resultados.
- `assets/js/historico-sorteios.js`: alternância de tema, carregamento e exclusão de registros do histórico, renovação da sessão e logout.
- `../server.js`: servidor Node.js, autenticação, API e persistência do histórico.
- `../package.json`: dependências e comandos do projeto.
- `../data/sorteios.db`: banco SQLite criado automaticamente ao iniciar o servidor.

## Sorteio

A página começa com seis caixas de participantes. É possível adicionar até 40 participantes ou remover caixas até o mínimo de dois. Campos vazios são ignorados, permitindo sortear somente com os nomes preenchidos.

Os times podem ser adicionados, removidos e renomeados. Ao sortear, os nomes preenchidos são embaralhados com Fisher–Yates e distribuídos igualmente entre todos os times. A aplicação exibe avisos visuais quando não há participantes ou quando a divisão não pode ser feita igualmente.

Após o sorteio, os cards dos times recebem uma animação de entrada e os participantes aparecem com um efeito sequencial. O resultado é enviado à API para registro no histórico.

## Interface e acessibilidade

A interface utiliza layout responsivo, cards, controles visuais e suporte a telas menores. O modo escuro é salvo no `localStorage`; a lua é exibida no modo claro e o sol no modo escuro. Mensagens de validação usam elementos visuais e `role="alert"` quando apropriado.

O ícone de usuário no canto superior esquerdo abre o login administrativo quando não há sessão ativa. Depois do login, o controle indica que o administrador está conectado e permite abrir o histórico em uma nova aba. O botão “Sair” no sorteador só aparece durante uma sessão autenticada. Cada abertura do formulário limpa os campos e inicia uma nova tentativa. A janela possui botão de fechamento, foco inicial no usuário e animações suaves.

## Autenticação e histórico

O login compara a senha com `bcryptjs` e emite um cookie de sessão `HttpOnly`, `SameSite=Lax` e `Secure` em produção. O cookie é compartilhado entre abas do mesmo site. O token aleatório não é armazenado em texto puro: o SQLite mantém seu hash na tabela `admin_sessions`, permitindo que a sessão sobreviva à reinicialização do servidor. A sessão expira após 30 minutos sem atividade e sua validade é renovada enquanto o administrador usa as páginas e APIs protegidas.

A página de histórico só é servida a uma sessão válida; sem autenticação, o servidor redireciona para o sorteador, que abre o formulário de login. As APIs administrativas também verificam a sessão no backend. O histórico lista data e hora, nomes dos times e participantes. Cada registro pode ser excluído após confirmação; a exclusão usa identificador validado e consulta parametrizada, remove o sorteio do SQLite e apaga seus times e participantes relacionados por cascata. A lista é atualizada sem recarregar a página e mensagens informam o resultado. O registro de novos sorteios permanece disponível no fluxo público do sorteador.

Há botão de logout tanto no sorteador quanto na página administrativa. O logout invalida a sessão persistida e remove o cookie. As credenciais padrão `admin` / `admin123` destinam-se somente ao uso inicial local; em produção, configure `ADMIN_USER` e `ADMIN_PASSWORD` fortes.

## Execução

O projeto exige Node.js 22.13 ou superior e deve ser executado pelo servidor HTTP,
não diretamente via `file://`. Na raiz do projeto:

```powershell
npm install
npm run dev
```

O comando `npm start` inicia o servidor sem reinicialização automática. Depois,
acesse `http://localhost:3000/sorteio-times.html` ou
`http://localhost:3000/`. O banco `data/sorteios.db` é criado ou atualizado
automaticamente pelo servidor.

Para configurar credenciais próprias no PowerShell, defina as variáveis de
ambiente antes de iniciar o servidor:

```powershell
$env:ADMIN_USER = "seu-usuario"
$env:ADMIN_PASSWORD = "uma-senha-forte"
npm run dev
```

Em produção, configure credenciais próprias, `NODE_ENV=production` e utilize
HTTPS. Nesse modo, o cookie da sessão é enviado somente por conexões seguras.
