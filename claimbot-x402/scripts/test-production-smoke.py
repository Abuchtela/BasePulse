import base64
import importlib.util
import json
import unittest
from email.message import Message
from pathlib import Path

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).with_name('production-smoke.py'))
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)

class SmokeTests(unittest.TestCase):
    def test_swapped_wallets_fail(self):
        config = dict(network=s.NETWORK, payTo=s.PAY_TO, publisher=s.PUBLISHER, signingNetwork='Arkiv Tiramisu')
        s.check_config(config)
        config.update(payTo=s.PUBLISHER, publisher=s.PAY_TO)
        with self.assertRaises(AssertionError): s.check_config(config)

    def test_empty_results_never_request_payment(self):
        body = json.dumps({'error':'No eligible verified opportunities currently available'}).encode()
        headers = Message()
        s.check_opportunities(404, headers, body)
        headers['payment-required'] = 'unexpected'
        with self.assertRaises(AssertionError): s.check_opportunities(404, headers, body)

    def test_challenge_validation(self):
        offer = dict(scheme='exact', network=s.NETWORK, payTo=s.PAY_TO,
                     asset='0x036cbd53842c5426634e7929541ec2318f3dcf7e', amount='100000')
        def headers():
            h = Message()
            h['payment-required'] = base64.b64encode(json.dumps(dict(x402Version=2, accepts=[offer])).encode()).decode()
            return h
        s.check_opportunities(402, headers(), b'{}')
        offer['network'] = 'eip155:8453'
        with self.assertRaises(AssertionError): s.check_opportunities(402, headers(), b'{}')
        with self.assertRaises(AssertionError): s.check_opportunities(402, Message(), b'{}')
        for status in [200,401,403,503]:
            with self.assertRaises(AssertionError): s.check_opportunities(status, Message(), b'{}')

if __name__ == '__main__': unittest.main()
