import os.path,subprocess
import firebase_admin
import nltk
import string
from flask import Flask, jsonify, request, Response
from subprocess import STDOUT,PIPE
from firebase_admin import credentials, db

app = Flask(__name__)
cred = credentials.Certificate('config.json')
firebase_admin.initialize_app(cred, {'databaseURL': 'https://study-start-d6061.firebaseio.com'})

ALLOWED_EXTENSION = set (['txt'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def putDb(data, topic):
    ref = db.reference('topics/' + topic)
    ref.set(data)
    return

def make_blank(tagged_lst):
    '''
    Takes in a list of pos tagged words. Replaces all words from the end to the last
    occurring conjunction/preposition/etc. to be a blank, and returns removed text as 
    a tuple with the new string and the removed part.
    '''
    SPLIT_TAGS = set(['CC', 'DT', 'EX', 'IN', 'TO', 'WDT', 'WP', 'WRP'])
    new_lst = []
    answer = ''
    for i in range(len(tagged_lst)-1, -1, -1):
        if tagged_lst[i][1] in SPLIT_TAGS:
            answer = ''
            if i < len(tagged_lst) - 1:
                answer = ' '.join([word[0] for word in tagged_lst[i + 1:] 
                                    if word[0] not in string.punctuation])
                tagged_lst[i] 
            new_lst = [lst[0] for lst in tagged_lst[:i + 1]]
            new_lst.append("blank")
            break
    return (' '.join(new_lst), answer)

# Must be binary data
def getFacts(data):
    cmd = ["java", "-Xmx1500m", "-cp", "factual-statement-extractor.jar:lib/jwnl.jar:lib/stanford-parser-2008-10-26.jar:lib/commons-logging.jar:lib/commons-lang.jar", "edu/cmu/ark/SentenceSimplifier"]
    proc = subprocess.Popen(cmd, stdin=PIPE, stdout=PIPE, stderr=STDOUT)
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
    data = None
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
    print(output)
    facts = output[3:-2]
    print(facts)
    # putDb(facts, topic)
    questions_answers = make_questions(facts)
    facts_json = {'facts': facts, 'questions': questions_answers}
    putDb(facts_json, topic)
    print(questions_answers)
    return jsonify(questions_answers)
#    return stdout.decode(), 200, {'Content-Type': 'text/plain; charset=utf-8'}

def make_questions(facts):
    blank_facts = []
    tokenizer = nltk.tokenize.TweetTokenizer()
    for fact in facts:
        words = tokenizer.tokenize(fact)
        tagged = nltk.pos_tag(words)
        parsed_str, answer = make_blank(tagged)
        if answer != '':
            blank_facts.append({'question': parsed_str, 'answer': answer})
    return blank_facts

if __name__ == '__main__':
    app.run(host='0.0.0.0')
