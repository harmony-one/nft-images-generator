#!/bin/sh
sudo cp 1ns-registrar-relay.service /etc/systemd/system/nft-data-generator.service
sudo systemctl enable nft-data-generator
sudo systemctl start nft-data-generator
systemctl status nft-data-generator
