"""Public HTTP checks only. Never signs, sends payments, or proves settlement."""
import base64
import json
import os
import re
import time
import urllib.error
import urllib.request

SITE = os.environ.get('SITE', 'https://claimbot-x402.vercel.app').rstrip('/')
PAY_TO = '0x748f6614Ea6289664bC8BeB84835E2F24fE52482'
PUBLISHER = '0x4aBAf297bd37bb3FA0036b45976A92a46d903688'
NETWORK = 'eip155:84532'


def request(path):
    try:
        response = urllib.request.urlopen(SITE + path, timeout=40)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        assert response.url == SITE + path, 'Unexpected redirect'
        body = response.read()
        print(f'{path}: HTTP {response.status}, {len(body)} bytes', flush=True)
        return response.status, response.headers, body


def check_config(config):
    assert config['network'] == NETWORK, 'Wrong payment network'
    assert config['payTo'].lower() == PAY_TO.lower(), 'Wrong payout wallet'
    assert config['publisher'].lower() == PUBLISHER.lower(), 'Wrong Arkiv publisher'
    assert config['signingNetwork'] == 'Arkiv Tiramisu', 'Wrong publishing network'


def check_opportunities(status, headers, body):
    data = json.loads(body)
    if status == 404:
        assert data == {'error': 'No eligible verified opportunities currently available'}
        assert not headers.get('payment-required'), 'Empty results must not request payment'
    else:
        assert status == 402, f'Unexpected opportunity response: {status}'
        encoded = headers.get('payment-required')
        assert encoded, 'Missing x402 challenge header'
        challenge = json.loads(base64.b64decode(encoded, validate=True))
        assert challenge['x402Version'] == 2
        accepts = challenge['accepts']
        assert accepts, 'Empty x402 accepts'
        for offer in accepts:
            assert offer['scheme'] == 'exact'
            assert offer['network'] == NETWORK
            assert offer['payTo'].lower() == PAY_TO.lower()
            assert offer['asset'].lower() == '0x036cbd53842c5426634e7929541ec2318f3dcf7e'
            assert offer['amount'] == '100000', 'Expected $0.10 test USDC'
        print('Challenge validated; settlement NOT tested', flush=True)


def main():
    expected = os.environ.get('EXPECTED_SHA')
    snapshot = os.environ.get('ALLOW_CURRENT_SNAPSHOT') == '1'
    assert expected or snapshot, 'Set EXPECTED_SHA, or explicitly opt into current snapshot checks'
    if expected:
        assert re.fullmatch(r'[0-9a-f]{40}', expected), 'Expected a full commit SHA'
    deadline = time.monotonic() + int(os.environ.get('DEPLOY_WAIT_SECONDS', '480'))
    while True:
        status, _, body = request('/health')
        health = json.loads(body) if status == 200 else {}
        if status == 200 and (not expected or health.get('revision') == expected):
            break
        assert time.monotonic() < deadline, 'Expected production revision never became healthy'
        print('Waiting for expected production revision', flush=True)
        time.sleep(10)
    assert health['status'] == 'ok' and health['service'] == 'claimbot-x402'
    assert health['network'] == NETWORK
    status, _, body = request('/config')
    assert status == 200
    check_config(json.loads(body))
    status, _, body = request('/publish.html')
    assert status == 200
    assert b'Connect publisher wallet' in body
    assert b'Sign &amp; publish on Arkiv testnet' in body
    status, _, body = request('/publisher.js')
    assert status == 200 and len(body) > 4000 and b'eth_requestAccounts' in body
    status, headers, body = request('/api/opportunities?project=Invalid')
    assert status == 400
    assert json.loads(body) == {'error': 'project must be BasePulse or ClaimBot'}
    assert not headers.get('payment-required')
    for project in ['ClaimBot', 'BasePulse']:
        check_opportunities(*request('/api/opportunities?project=' + project))
    # Detect alias movement during the check, too.
    if expected:
        status, _, body = request('/health')
        assert status == 200 and json.loads(body)['revision'] == expected
    print('PASS: ' + ('revision-bound' if expected else 'current snapshot only; revision NOT verified')
          + ' public HTTP smoke. Payment settlement NOT tested.', flush=True)


if __name__ == '__main__':
    main()
