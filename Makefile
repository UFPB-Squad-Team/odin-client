SHELL := /bin/zsh

NPM := npm
NODE_MODULES := node_modules
NEXT_BUILD_DIR := .next

.PHONY: \
	help \
	install ci \
	dev dev-host \
	build start lint \
	check verify \
	clean clean-all reset \
	reinstall \
	deps-outdated deps-audit deps-audit-fix \
	env-info

help:
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "Setup"
	@echo "  make install        - instala dependências (npm install)"
	@echo "  make ci             - instala dependências exatas do lockfile (npm ci)"
	@echo ""
	@echo "Desenvolvimento"
	@echo "  make dev            - inicia Next.js em modo dev"
	@echo "  make dev-host       - inicia Next.js em 0.0.0.0:3000"
	@echo ""
	@echo "Qualidade"
	@echo "  make lint           - executa lint"
	@echo "  make build          - gera build de produção"
	@echo "  make check          - roda lint + build"
	@echo "  make verify         - alias para check"
	@echo ""
	@echo "Produção"
	@echo "  make start          - inicia servidor de produção (requer build)"
	@echo ""
	@echo "Manutenção"
	@echo "  make clean          - remove somente .next"
	@echo "  make clean-all      - remove .next e cache do npm"
	@echo "  make reinstall      - reinstala dependências mantendo lockfile"
	@echo "  make reset          - remove node_modules + lockfile e reinstala"
	@echo ""
	@echo "Dependências"
	@echo "  make deps-outdated  - lista pacotes desatualizados"
	@echo "  make deps-audit     - executa auditoria de segurança"
	@echo "  make deps-audit-fix - tenta corrigir vulnerabilidades sem breaking changes"
	@echo ""
	@echo "Diagnóstico"
	@echo "  make env-info       - mostra versões de node e npm"

install:
	$(NPM) install

ci:
	$(NPM) ci

dev: $(NODE_MODULES)
	$(NPM) run dev

dev-host: $(NODE_MODULES)
	$(NPM) run dev -- --hostname 0.0.0.0 --port 3000

build: $(NODE_MODULES)
	$(NPM) run build

start: $(NODE_MODULES)
	$(NPM) run start

lint: $(NODE_MODULES)
	$(NPM) run lint

check: lint build

verify: check

clean:
	rm -rf $(NEXT_BUILD_DIR)

clean-all: clean
	$(NPM) cache clean --force

reinstall:
	rm -rf $(NODE_MODULES)
	$(NPM) install

reset:
	rm -rf $(NODE_MODULES) package-lock.json
	$(NPM) install

deps-outdated: $(NODE_MODULES)
	$(NPM) outdated || true

deps-audit: $(NODE_MODULES)
	$(NPM) audit

deps-audit-fix: $(NODE_MODULES)
	$(NPM) audit fix

env-info:
	@echo "node: $$($(NPM) exec -- node -v)"
	@echo "npm:  $$($(NPM) -v)"

$(NODE_MODULES):
	$(NPM) install
