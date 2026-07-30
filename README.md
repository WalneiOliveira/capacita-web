# Capacitação em Programação Web — Plataforma E-Learning Extensionista

> **Instituição:** Centro Universitário Internacional UNINTER  
> **Escola:** Superior Politécnica (ESP)  
> **Curso:** Bacharelado em Engenharia de Software  
> **Disciplina:** Atividade Extensionista II: Tecnologia Aplicada à Inclusão Digital - Projeto  
> **Aluno:** Walnei de Oliveira Assis (RU: 4411359)

---

## 📌 Contexto e Impacto Social

O **Capacita-Web** é uma solução e-learning desenvolvida para promover a inclusão digital e alfabetização tecnológica de estudantes do ensino médio em escolas públicas no Setor Cruzeiro (Brasília/DF). A plataforma oferta cursos gratuitos e estruturados em tecnologias essenciais do desenvolvimento web front-end (_HTML_, _CSS_, _JavaScript_, _Type Script_, _Angular_ etc..).

### **Alinhamento com os Objetivos de Desenvolvimento Sustentável (ODS/ONU)**

- 🎓 **ODS 04 — Educação de Qualidade:** Acesso a aprendizado técnico de alto nível focado no desenvolvimento de raciocínio lógico e habilidades práticas.
- 💼 **ODS 08 — Trabalho Decente e Crescimento Econômico:** Capacitação técnica inicial que prepara jovens para oportunidades de entrada no mercado da tecnologia da informação.

---

## ⚙️ Regras de Negócio e Funcionalidades

### 1. Gestão de Acessos e Troca de Senha Temporária

- **Alunos matriculados via Backoffice:**
  - A gestão de matrículas é feita pela escola após o aluno responder ao questionário com dados pessoais e interesses por área de cursos.
  - Quando a escola cadastra um aluno via backoffice, ao realizar o primeiro login o sistema obriga a troca da senha temporária criada no backoffice.
  - Após isso o acesso de aluno permite a gestão completa de acesso aos cursos (matricular e cancelar matricula em cursos) pelo aluno.

### 2. Gestão de Cursos e Vídeos (Backoffice)

- Operações completas de CRUD para Cursos e Vídeos.
- Criação de novos cursos adição de catálogo de vídeos aos blocos de cursos, gestão de usuários e papéis, matrículas com senha temporária.

### 3. Matrículas

- Cadastro simplificado com atribuição de curso e geração de credencial temporária para o estudante.

### 4. Acesso Restrito de usuários

- A aplicação está restrita aos estudantes no front-end e a escola e ao administrador da app no backoffice.

---

## 📋 Requisitos do Sistema

### Requisitos Funcionais (RF)

| ID       | Descrição                                                                  |
| :------- | :------------------------------------------------------------------------- |
| **RF01** | O aluno se cadastra através de formulário/plataforma.                      |
| **RF02** | A escola controla o cadastro e acessos dos alunos através do Backoffice.   |
| **RF03** | Os cursos oferecidos são de nível básico/intermediário em programação web. |
| **RF04** | O conteúdo abrange HTML, CSS e JavaScript, Type Script e Angular.          |
| **RF05** | O sistema demonstra a evolução do número de horas assistidas pelo aluno.   |
| **RF06** | O sistema emitira certificado de conclusão (nome, curso e carga horária).  |

### Requisitos Não-Funcionais (RNF)

| ID        | Descrição                                                                  |
| :-------- | :------------------------------------------------------------------------- |
| **RNF01** | Interface intuitiva, acessível e amigável ao usuário.                      |
| **RNF02** | Disponibilidade de 24/7 com tempo de resposta ágil.                        |
| **RNF03** | Tempo máximo de restauração do serviço em caso de falha de até 30 minutos. |
| **RNF04** | Armazenamento de dados persistente com suporte à nuvem.                    |

---

---

## 🏗️ Arquitetura Técnica e Engenharia do Projeto

O projeto adota boas práticas modernas de Engenharia de Software, focando em manutenibilidade, segurança por padrão e reatividade refinada.

```text
capacita-web/
├── api/                   # Servidor REST mock & Banco de dados local
│   ├── db.json
│   └── server.cjs
└── src/
    ├── app/
    │   ├── components/    # Componentes reutilizáveis
    │   ├── directives/    # Diretivas customizadas de UI/Comportamento
    │   ├── guards/        # Camada de proteção de rotas por perfis e regras
    │   ├── interceptors/  # Interceptadores HTTP (Anexo de tokens / Tratamento de erros)
    │   ├── models/        # Contratos de dados (Interfaces fortemente tipadas)
    │   ├── pages/         # Views/Páginas principais da aplicação
    │   └── services/      # Comunicação HTTP e lógica de negócios isolada
    ├── styles.scss        # Estilização global e variáveis SCSS
    └── app.routes.ts      # Mapeamento de rotas e navegação da SPA
```
