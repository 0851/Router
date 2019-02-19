build :
	@rm -rf dist
	@mkdir -p dist
	@cp src/index.js  dist/rr.js
	@npx uglifyjs src/index.js -o dist/rr.min.js -m