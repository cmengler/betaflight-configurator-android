# Build Tips

## OpenJDK

```bash
sudo apt install openjdk-8-jdk
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
```

## Gradle

```bash
wget https://downloads.gradle-dn.com/distributions/gradle-3.5.1-bin.zip
unzip gradle-3.5.1-bin.zip
export GRADLE_HOME=/path/to/gradle-3.5.1/bin
export PATH=$PATH:$GRADLE_HOME
```
