NAME=ges-eventsourcing

clean:
	cd ../mf_frontend && rm -rf node_modules yarn.log && yarn;
	cd ../mf_data && rm -rf node_modules yarn.log && yarn;
	cd ../mf_api && rm -rf node_modules yarn.log && yarn;
	cd ../mf_workflows && rm -rf node_modules yarn.log && yarn;
	cd ../mf_projections && rm -rf node_modules yarn.log && yarn;

.PHONY: clean install docker-build run
