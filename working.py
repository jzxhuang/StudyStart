import os.path,subprocess
import firebase_admin
import nltk
from flask import Flask, jsonify, request, Response
from subprocess import STDOUT,PIPE
from firebase_admin import credentials, db

app = Flask(__name__)

ALLOWED_EXTENSION = set (['txt'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def putDb(data, topic):
    cred = credentials.Certificate('config.json')
    firebase_admin.initialize_app(cred, {'databaseURL': 'https://study-start-d6061.firebaseio.com'})
    ref = db.reference('topics/' + topic)
    ref.set(data)
    return

def tree_to_list(tree, lst, label=None):
    parent_lst = lst
    if label is not None:
       lst = [label] 
    for node in tree:
        if type(node) != nltk.tree.Tree:
            lst.append(node.split('/')[0])
        else:
            tree_to_list(node, parent_lst, node.label())
    if label is not None:
        parent_lst.append(lst)

def make_blank(parsed_lst):
    '''
    Given a list of named entity tagged words, replace the last named entity with blank and
    return the word that was taken out
    '''
    answer = ''
    for i in range(len(parsed_lst)-1, -1, -1):
        if type(parsed_lst[i]) == list:
            answer = parsed_lst[i][1]
            parsed_lst[i] = 'blank'
            break
    return answer

def format_parse(parsed, sublist=False):
    '''
    Transform a named entity list into a string
    '''
    if sublist:
        parsed.pop(0)
    for i in range(len(parsed)):
        if type(parsed[i]) == list:
            format_parse(parsed[i], sublist=True)
            parsed[i] = " ".join(parsed[i])    
    return " ".join(parsed)

# Must be binary data
def getFacts(data):
    cmd = ["java", "-Xmx1500m", "-cp", "factual-statement-extractor.jar:lib/jwnl.jar:lib/stanford-parser-2008-10-26.jar:lib/commons-logging.jar:lib/commons-lang.jar", "edu/cmu/ark/SentenceSimplifier"]
    proc = subprocess.Popen(cmd, stdin=PIPE, stdout=PIPE, stderr=STDOUT)
    msg = "Prime Minister Vladimir V. Putin, the country’s paramount leader, cut short a trip to Siberia, returning to Moscow to oversee the federal response. Mr. Putin built his reputation in part on his success at suppressing terrorism, so the attacks could be considered a challenge to his stature."
    stdout, stderr = proc.communicate(data)
    output = stdout.decode().split('\n')
    return output

@app.route('/', methods=['POST'])
def main():
    data = request.data
    output = getFacts(data)
    print(output[3:-2])
    topic = 'test'
    putDb(output[3:-2], topic)
    return 'success'
#    return output, 200, {'Content-Type': 'text/plain; charset=utf-8'}

@app.route('/new', methods=['POST'])
def do():
    topic = request.form['topic']
    print(topic)
    data
    if (request.form['url']):
        print(request.form['url'])
    else:
        file = request.files['file']
        print(type(file))
        print(file)
        contents = file.read()
        print(contents)
        data = contents
    output = getFacts(data)
    putDb(output[3:-2], topic)
    print(output)
    output = output.split('\n')
    return 'success'
#    return stdout.decode(), 200, {'Content-Type': 'text/plain; charset=utf-8'}

@app.route('/makequestions', methods=['POST'])
def make_questions():
    facts = request.json['facts']
    blank_facts = []
    tokenizer = nltk.tokenize.TweetTokenizer()
    for fact in facts:
        words = tokenizer.tokenize(fact)
        tagged = nltk.ne_chunk(nltk.pos_tag(words))
        ne_tree = nltk.tree.Tree.fromstring(str(tagged))
        parsed = []
        tree_to_list(ne_tree, parsed)
        answer = make_blank(parsed)
        parsed_str = format_parse(parsed)
        if answer != '':
            blank_facts.append({'question': parsed_str, 'answer': answer})
    return jsonify(blank_facts)

if __name__ == '__main__':
    app.run(host='0.0.0.0')
