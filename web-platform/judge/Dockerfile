# Base Image
FROM --platform=linux/amd64 public.ecr.aws/ubuntu/ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN sed -i 's|http://ports.ubuntu.com/ubuntu-ports|http://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports|g' /etc/apt/sources.list && \
    sed -i 's|http://archive.ubuntu.com/ubuntu|http://mirrors.tuna.tsinghua.edu.cn/ubuntu|g' /etc/apt/sources.list && \
    sed -i 's|http://security.ubuntu.com/ubuntu|http://mirrors.tuna.tsinghua.edu.cn/ubuntu|g' /etc/apt/sources.list && \
    apt-get update -o Acquire::Retries=5 && apt-get install -y \
    build-essential \
    gcc \
    gdb \
    valgrind \
    python3 \
    python3-pip \
    make \
    && rm -rf /var/lib/apt/lists/*

# Install Python HTTP server
RUN pip3 install flask

# Create directories for test resources
RUN mkdir -p /usr/local/l2p/subseq

# Copy and compile subseq test implementations
COPY subseq/ /tmp/subseq/
RUN cd /tmp/subseq && \
    gcc -c -o /usr/local/l2p/subseq/subseq.o subseq.c && \
    gcc -c -o /usr/local/l2p/subseq/subseq1.o subseq1.c && \
    gcc -c -o /usr/local/l2p/subseq/subseq2.o subseq2.c && \
    gcc -c -o /usr/local/l2p/subseq/subseq3.o subseq3.c && \
    gcc -c -o /usr/local/l2p/subseq/subseq4.o subseq4.c && \
    rm -rf /tmp/subseq

# Create working directory
WORKDIR /app

# Copy judge scripts
COPY run_job.py /app/run_job.py
COPY server.py /app/server.py

# Expose HTTP port
EXPOSE 9090

# Run the HTTP server
CMD ["python3", "/app/server.py"]
