# treinamento-sorteador
🎲 Sorteador de Times

Aplicação web para sortear times de forma justa, com histórico de sorteios salvo em banco de dados e uma área administrativa protegida por login.

✨ Funcionalidades
Sorteio
De 2 a 40 participantes (começa com 6 campos; adicione ou remova conforme necessário).
Campos vazios são ignorados, então é possível sortear apenas com os nomes preenchidos.
Times podem ser adicionados, removidos e renomeados.
Embaralhamento com o algoritmo Fisher–Yates e distribuição igual entre os times.
Avisos visuais quando não há participantes ou quando a divisão igualitária não é possível.
Animações de entrada nos cards dos times e efeito sequencial na exibição dos participantes.
Cada sorteio é registrado automaticamente no histórico via API.
Interface
Layout responsivo, com suporte a telas menores.
Modo claro/escuro (a preferência é salva no localStorage).
Mensagens de validação acessíveis, com role="alert" quando apropriado.
Área administrativa
Login real com sessão persistente, compartilhada entre as abas do navegador.
Página de histórico aberta em uma nova aba, sem pedir login novamente.
Listagem de sorteios com data/hora, times e participantes.
Exclusão de registros com confirmação, refletida diretamente no banco de dados.
Lista atualizada sem recarregar a página e mensagens de sucesso/erro.
Botão de logout no sorteador e na página administrativa.
🔐 Autenticação e segurança
Senha verificada com bcryptjs.
Cookie de sessão HttpOnly, SameSite=Lax e Secure em produção.
O token de sessão não é guardado em texto puro: o SQLite armazena apenas o hash (tabela admin_sessions), e a sessão sobrevive à reinicialização do servidor.
Expiração após 30 minutos de inatividade, com renovação enquanto o administrador usa as páginas e APIs protegidas.
A página de histórico só é servida para sessões válidas; sem autenticação, o usuário é redirecionado para o sorteador, que abre o formulário de login.
As APIs administrativas validam a sessão no backend.
Exclusão com identificador validado e consulta parametrizada (protege contra SQL injection). Times e participantes relacionados são removidos por cascata.
O logout invalida a sessão no banco e remove o cookie.

⚠️ As credenciais padrão admin / admin123 servem somente para uso inicial local. Em produção, defina ADMIN_USER e ADMIN_PASSWORD fortes.


🛠️ Tecnologias
Front-end: HTML, CSS e JavaScript puro
Back-end: Node.js
Banco de dados: SQLite
Autenticação: bcryptjs + cookies de sessão
📁 Estrutura do projeto
```.
├── server.js                        # Servidor Node.js: autenticação, API e persistência
├── package.json                     # Dependências e scripts
├── data/
│   └── sorteios.db                  # Banco SQLite (criado automaticamente)
└── <pasta-do-front-end>/
    ├── sorteio-times.html           # Interface principal + formulário de login administrativo
    ├── historico-sorteios.html      # Página administrativa de histórico
    └── assets/
        ├── css/
        │   ├── sorteio-times.css        # Estilos da página principal
        │   └── historico-sorteios.css   # Estilos da página de histórico
        └── js/
            ├── sorteio-times.js         # Sorteio, times, tema, login e envio dos resultados
            └── historico-sorteios.js    # Tema, histórico, exclusão, renovação de sessão e logout
```
🚀 Como executar
Pré-requisitos
Node.js 22.13 ou superior

O projeto precisa ser executado pelo servidor HTTP. Não abra os arquivos diretamente via file://.

Instalação

Na raiz do projeto:

```
bash
npm install
npm run dev
npm run dev: inicia o servidor com reinicialização automática.
npm start: inicia o servidor sem reinicialização automática.
```

Depois, acesse:

http://localhost:3000/

ou

http://localhost:3000/sorteio-times.html

O banco data/sorteios.db é criado ou atualizado automaticamente ao iniciar o servidor.

Configurando credenciais próprias

PowerShell (Windows):
```
powershell
$env:ADMIN_USER = "seu-usuario"
$env:ADMIN_PASSWORD = "uma-senha-forte"
npm run dev

Bash (Linux/macOS):

bash
export ADMIN_USER="seu-usuario"
export ADMIN_PASSWORD="uma-senha-forte"
npm run dev
```
🌐 Produção

Para publicar o sistema:

Defina ADMIN_USER e ADMIN_PASSWORD com valores fortes.
Defina NODE_ENV=production.
Use HTTPS. Nesse modo, o cookie de sessão é enviado apenas por conexões seguras.
🧭 Como usar
Preencha os nomes dos participantes e ajuste os times, se quiser.
Clique em sortear para ver a divisão. O resultado é salvo automaticamente.
Clique no ícone de usuário (canto superior esquerdo) e faça login para acessar a área administrativa.
Abra o histórico (em nova aba), consulte os sorteios e exclua os que não quiser mais manter.
Use o botão Sair quando terminar.
📄 Licença

Defina aqui a licença do projeto (por exemplo, MIT).
