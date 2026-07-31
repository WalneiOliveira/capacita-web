# Capacitação em Programação Web — CAPACITA WEB APP

> **Instituição:** Centro Universitário Internacional UNINTER  
> **Escola:** Superior Politécnica (ESP)  
> **Curso:** Bacharelado em Engenharia de Software  
> **Disciplina:** Atividade Extensionista III: Tecnologia Aplicada à Inclusão Digital - Trabalho Final  
> **Aluno:** Walnei de Oliveira Assis (RU: 4411359)  

---

## 📌 Contexto e Impacto Social

O **Capacita-Web** é uma plataforma e-learning desenvolvida para promover a inclusão digital e a alfabetização tecnológica de estudantes do ensino médio em uma escola pública no Setor Cruzeiro (Brasília/DF). 
O sistema oferece cursos gratuitos e estruturados com foco em tecnologias fundamentais do desenvolvimento web moderno, tais como *HTML*, *CSS*, *JavaScript*, *TypeScript* e *Angular*.
O principal objetivo é promover a inclusão digital e a alfabetização tecnológica, tornando o conhecimento em TI acessível à comunidade escolar.

### **Alinhamento com os Objetivos de Desenvolvimento Sustentável (ODS/ONU)**
* 🎓 **ODS 04 — Educação de Qualidade:** Promove o acesso a um aprendizado técnico estruturado, incentivando o raciocínio lógico e o desenvolvimento de competências práticas em tecnologia.
* 💼 **ODS 08 — Trabalho Decente e Crescimento Econômico:** Proporciona qualificação técnica inicial, preparando os jovens para as demandas e oportunidades do mercado de trabalho em TI.

---

## ⚙️ Regras de Negócio e Funcionalidades

### 1. Gestão de Acessos e Troca Obrigatorória de Senha
* **Acesso Institucional via Backoffice:** A escola gerencia as matrículas com base nas respostas dos alunos ao formulário de perfil e interesse profissional.
* **Segurança no Primeiro Acesso:** Ao ser cadastrado pelo Backoffice, o aluno recebe credenciais temporárias. O sistema exige compulsoriamente a redefinição de senha no primeiro login antes de liberar o acesso às funcionalidades da plataforma.
* **Autonomia do Aluno:** Após a troca de senha, o estudante obtém acesso total à sua área exclusiva, podendo gerenciar suas matrículas, ingressar ou cancelar a inscrição em cursos livremente.

### 2. Gestão de Conteúdo e Administração (Backoffice)
* Operações completas de CRUD (Criação, Leitura, Atualização e Remoção) para cursos e acervo de vídeos.
* Organização modular de aulas e vídeos dentro de cada curso.
* Gestão centralizada de usuários, perfis de acesso (*roles*) e emissão de credenciais provisórias.

### 3. Matrícula e Acompanhamento
* Vínculo simplificado de estudantes aos cursos do catálogo.
* Registro e apresentação em tempo real da evolução de horas assistidas e progresso de aprendizagem.

### 4. Controle de Acesso Baseado em Perfis (RBAC)
* Restrições granulares de navegação: interface simplificada focada na experiência do estudante (Front-end) e ambiente administrativo protegido reservado aos gestores da escola e administradores (Backoffice).

---

## 🛡️ Destaques Arquiteturais & Boas Práticas

### 1. Proteção de Rotas com Guards
A aplicação utiliza **Route Guards** nativos do Angular para impor as regras de acesso no lado do cliente:
* **`auth.guard`:** Garante que apenas usuários devidamente autenticados naveguem pela aplicação.
* **`backoffice.guard` & `aluno.guard`:** Isolam as rotas administrativas das visões exclusivas do estudante.
* **`trocar-senha.guard`:** Intercepta a navegação e força o redirecionamento imediato para a tela de redefinição de senha quando a *flag* de senha temporária estiver ativa.
* **`role-redirect.guard`:** Direciona o fluxo inicial do usuário para o seu painel correspondente (*Home/Meus Cursos* para alunos ou *Backoffice* para administradores).

### 2. Tipagem Estrita e Modelagem de Dados
A comunicação e o fluxo de informações utilizam interfaces TypeScript para garantir a consistência dos dados:
* `user.ts` e `authentication.ts` para controle de sessão e permissões.
* `curso.model.ts`, `video.model.ts` e `matricula.model.ts` para representação dos conteúdos e vínculos acadêmicos.
* `curso-progresso.ts` para mensurar o avanço dos alunos nas aulas.

### 3. Design System, Reatividade e Desempenho
* **Gerenciamento de Estado:** Utilização de **Angular Signals** (`signal`, `computed`) para atualizar a interface de forma reativa e eficiente.
* **Interface do Usuário:** Construída com **Angular Material** e estilitzada via **SCSS** modularizado, garantindo padrão visual limpo, acessível e responsivo.

---

## 📋 Requisitos do Sistema

### Requisitos Funcionais (RF)
| ID | Descrição |
| :--- | :--- |
| **RF01** | O aluno realiza seu cadastro via formulário ou plataforma. |
| **RF02** | A escola administra o cadastro e as permissões dos alunos por meio do Backoffice. |
| **RF03** | O catálogo oferece cursos de nível básico e intermediário em desenvolvimento web. |
| **RF04** | O conteúdo abrange HTML, CSS, JavaScript, TypeScript e Angular. |
| **RF05** | O sistema exibe o progresso e o total de horas de aulas assistidas pelo aluno. |
| **RF06** | O sistema gera certificado de conclusão contendo nome do aluno, curso e carga horária. |

### Requisitos Não-Funcionais (RNF)
| ID | Descrição |
| :--- | :--- |
| **RNF01** | Interface intuitiva, amigável e com alto nível de usabilidade. |
| **RNF02** | Operação contínua 24/7 com respostas ágeis às requisições do usuário. |
| **RNF03** | Suporte técnico com tempo máximo de restauração do serviço de até 30 minutos em caso de falhas. |
| **RNF04** | Armazenamento seguro e persistente de dados com suporte à infraestrutura em nuvem. |

---

## 🏗️ Arquitetura Técnica e Estrutura de Arquivos

O projeto adota uma estrutura modular e desacoplada, separando claramente as responsabilidades de visualização, lógica de negócios, controle de acesso e integração com APIs.

```text
capacita-web/
├── api/                                # Backend Mock & Banco de Dados Local
│   ├── db.json                         # Base de dados persistente em formato JSON
│   └── server.cjs                      # Servidor Node.js Express / JSON Server
└── src/
    ├── app/
    │   ├── components/                 # Componentes visuais reutilizáveis
    │   ├── directives/                 # Diretivas customizadas de UI/Comportamento
    │   ├── guards/                     # Proteção de rotas e controle de acesso
    │   │   ├── aluno.guard.ts          # Protege rotas exclusivas de alunos
    │   │   ├── auth.guard.ts           # Valida estado de autenticação
    │   │   ├── backoffice.guard.ts     # Restringe rotas administrativas
    │   │   ├── role-redirect.guard.ts  # Redireciona usuários com base no perfil
    │   │   └── trocar-senha.guard.ts   # Bloqueia navegação e exige redefinição de senha
    │   ├── interceptors/               # Interceptadores HTTP (Anexo de cabeçalhos e tokens)
    │   ├── models/                     # Interfaces TypeScript e contratos de dados
    │   │   ├── authentication.ts
    │   │   ├── credentials.ts
    │   │   ├── curso-progresso.ts
    │   │   ├── curso.model.ts
    │   │   ├── matricula.model.ts
    │   │   ├── user.ts
    │   │   └── video.model.ts
    │   ├── pages/                      # Visões/Páginas principais da aplicação
    │   │   ├── backoffice/             # Gestão de cursos, vídeos, alunos e matrículas
    │   │   ├── curso-detalhe/          # Player de vídeo e detalhes do curso
    │   │   ├── cursos/                 # Catálogo geral de cursos oferecidos
    │   │   ├── hero/                   # Seção de destaques e apresentação
    │   │   ├── home/                   # Dashboard inicial do sistema
    │   │   ├── login/                  # Tela de autenticação de usuários
    │   │   ├── meus-cursos/            # Painel do aluno com cursos matriculados e progresso
    │   │   └── trocar-senha/           # Formulário para redefinição obrigatória de senha
    │   ├── services/                   # Lógica de integração HTTP e regras de negócio
    │   │   ├── app.config.ts           # Configurações globais de injeção de dependência
    │   │   ├── auth.service.ts         # Gerenciamento de sessão e tokens (JWT Bearer Token)
    │   │   ├── curso.service.ts        # Consumo de endpoints de cursos e vídeos
    │   │   ├── matricula.service.ts    # Regras de inscrição e progresso dos alunos
    │   │   └── user.service.ts         # CRUD e administração de contas de usuários
    │   ├── app.html                    # Layout base da SPA
    │   ├── app.routes.ts               # Mapeamento e distribuição das rotas da aplicação
    │   ├── app.scss                    # Estilos globais do componente principal
    │   └── app.ts                      # Componente raiz da aplicação
    ├── styles.scss                     # Estilização global e variáveis SCSS
    └── main.ts                         # Ponto de entrada da aplicação Angular
