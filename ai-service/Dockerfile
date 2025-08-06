# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# --- Install System-Level Dependencies ---
# Update package lists and install texlive for LaTeX compilation.
# 'texlive-latex-extra' and 'texlive-fonts-recommended' provide a good balance
# of functionality without installing the entire massive 'texlive-full' package.
# '--no-install-recommends' helps keep the image size smaller.
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-binaries \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

# --- Install Python Dependencies ---
# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# --- Copy Application Code ---
# Copy the rest of the application's code into the container
COPY . .

# --- Run the Application ---
# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define the command to run your app using uvicorn
# Use --host 0.0.0.0 to make it accessible from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]