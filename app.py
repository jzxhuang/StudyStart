import os.path,subprocess
from flask import Flask, request, Response
from subprocess import STDOUT,PIPE

app = Flask(__name__)

@app.route('/', methods=['POST'])
def main():
#    os.system('bash runStanfordParserServer.sh &')
    data = request.data
    cmd = ["java", "-Xmx1500m", "-cp", "factual-statement-extractor.jar:lib/jwnl.jar:lib/stanford-parser-2008-10-26.jar:lib/commons-logging.jar:lib/commons-lang.jar", "edu/cmu/ark/SentenceSimplifier"]
    proc = subprocess.Popen(cmd, stdin=PIPE, stdout=PIPE, stderr=STDOUT)
    msg = "Prime Minister Vladimir V. Putin, the country’s paramount leader, cut short a trip to Siberia, returning to Moscow to oversee the federal response. Mr. Putin built his reputation in part on his success at suppressing terrorism, so the attacks could be considered a challenge to his stature."
#    stdout,stderr = proc.communicate(str.encode(data))
    stdout, stderr = proc.communicate(data)
    print('This was "' + stdout.decode() + '"')
    return stdout.decode(), 200, {'Content-Type': 'text/plain; charset=utf-8'}

if __name__ == '__main__':
    app.run(host='0.0.0.0')
