.PHONY: docker

docker: init
	@echo "Launching containers"
	docker-compose up -d

node: init
	@echo "Installing dependencies"
	npm install
	@echo "Building front app"
	npm run build
	@echo "Launching server"
	npm start

init:
	@echo "Checking and creating initial values"
	./init.sh

