import * as React from "react";
import {
  Transaction,
  IDappProvider,
  Address,
  TransactionHash,
  Nonce,
} from "@elrondnetwork/erdjs";
import ledgerErrorCodes from "helpers/ledgerErrorCodes";
import { useContext } from "context";
import SendWizard from "./SendWizard";
import { getProviderType } from "./helpers";
import { useRefreshAccount } from "helpers/accountMethods";
import walletSign from "./walletSign";

interface SignTransactionsType {
  transactions: Transaction[];
  callbackRoute: string;
}

export default function Send() {
  const [showSendModal, setShowSendModal] = React.useState(false);
  const [showStatus, setShowStatus] = React.useState(false);
  const [txHash, setTxHash] = React.useState<TransactionHash>(
    new TransactionHash("")
  );
  const [newTransactions, setNewTransactions] = React.useState<Transaction[]>();
  const [newCallbackRoute, setNewCallbackRoute] = React.useState("");
  const [error, setError] = React.useState("");
  const context = useContext();
  const { dapp, address } = context;
  const refreshAccount = useRefreshAccount();

  const provider: IDappProvider = dapp.provider;

  const providerType = getProviderType(provider);

  const handleClose = () => {
    setNewTransactions(undefined);
    setNewCallbackRoute("");
    setShowStatus(false);
    setError("");
    setShowSendModal(false);
  };

  const send = (e: CustomEvent) => {
    if (e.detail && "transactions" in e.detail && "callbackRoute" in e.detail) {
      const { transactions, callbackRoute } = e.detail;
      signTransactions({ transactions, callbackRoute });
    }
  };

  React.useEffect(() => {
    document.addEventListener("transaction", send);
    return () => {
      document.removeEventListener("transaction", send);
    };
  }, [context]);

  const signTransactions = ({
    transactions,
    callbackRoute,
  }: SignTransactionsType) => {
    const showError = (e: string) => {
      setShowSendModal(true);
      setError(e);
    };

    if (provider) {
      switch (providerType) {
        case "wallet":
          dapp.proxy
            .getAccount(new Address(address))
            .then((account) => {
              transactions.forEach((tx, i) => {
                tx.setNonce(new Nonce(account.nonce.valueOf() + i));
              });

              walletSign({ transactions, callbackRoute });
            })
            .catch((e) => {
              showError(e);
            });
          break;
      }
    } else {
      setShowSendModal(true);
      setError(
        "You need a singer/valid signer to send a transaction, use either WalletProvider, LedgerProvider or WalletConnect"
      );
    }
  };

  const sendProps = {
    handleClose,
    error,
    show: showSendModal,
    transactions: newTransactions || [],
    providerType,
    callbackRoute: newCallbackRoute,
  };

  return <SendWizard {...sendProps} />;
}
