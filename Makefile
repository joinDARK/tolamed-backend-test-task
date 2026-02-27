app: build

build:
	podman compose up --build -d

down:
	podman compose down

remove:
	podman compose down -v

recreate: remove build