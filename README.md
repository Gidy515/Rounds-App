<div align="center">

# 🔄 Rounds Protocol

### Trustless Rotating Savings on Solana

*A collateralized onchain rotating savings protocol that enables trustless group savings and scheduled payouts.*

![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=for-the-badge)
![Anchor](https://img.shields.io/badge/Smart%20Contracts-Anchor-14F195?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge)

</div>

---

# Overview

Rounds Protocol is a decentralized Rotating Savings and Credit Association (ROSCA) built on Solana.

Known around the world as **Adashe**, **Esusu**, **Ajo**, **Chama**, **Tanda**, **Hui**, and many other names, ROSCAs have helped communities coordinate savings for centuries. Despite facilitating hundreds of billions of dollars in economic activity globally, they remain almost entirely offline and dependent on social trust.

Rounds Protocol brings this financial primitive onchain.

By replacing trust with smart contracts and collateral-backed commitments, Rounds enables anyone to participate in rotating savings circles without needing to know or trust the other participants.

---

# Why Rounds?

Traditional ROSCAs work well—but only within trusted communities.

They suffer from several limitations:

- Members can stop contributing after receiving their payout.
- Record keeping is manual and prone to disputes.
- Participation is usually limited to friends, family, or local communities.
- There is little transparency or accountability.
- The model is difficult to scale globally.

Rounds Protocol removes these limitations through deterministic smart contract enforcement.

Instead of relying on reputation, participants rely on transparent onchain rules.

---

# What Makes Rounds Different?

Rounds is not simply another savings application.

Nor is it another lending protocol.

Instead, it combines three familiar DeFi primitives into a new capital coordination primitive:

- **Savings** — Participants commit long-term capital to a savings circle.
- **Scheduled Liquidity** — Every participant receives the pooled savings according to a transparent schedule.
- **Yield (Future)** — Committed capital can eventually be deployed into productive yield strategies while continuing to secure the protocol.

The result is a new way for groups to coordinate capital without trusted intermediaries.

---

# How It Works

## 1. Create a Savings Circle

Anyone can create a savings circle by defining:

- Contribution amount
- Number of participants
- Payment frequency
  - Daily
  - Weekly
  - Bi-weekly
  - Monthly

---

## 2. Join the Circle

Participants join permissionlessly.

Positions are assigned automatically according to join order.

Example:

```
Alice joins first  → Position 1
Bob joins second   → Position 2
Carol joins third  → Position 3
...
```

Join order determines payout order.

---

## 3. Commit Savings

Each participant commits capital proportional to their remaining obligations within the circle.

These committed funds secure future contributions throughout the lifecycle of the savings circle.

Rather than remaining idle, this capital forms the foundation for future yield-generating strategies planned for later protocol versions.

---

## 4. Contribute Periodically

Participants contribute at every scheduled interval.

For example:

```
10 Members

$100 Contribution

Monthly
```

Each participant contributes $100 every month.

During the first round, participants after Position 1 also pay a one-time premium that rewards the first participant for taking the earliest and highest commitment.

---

## 5. Receive Scheduled Payouts

At every contribution interval:

- contributions are pooled,
- the designated participant receives the entire pot,
- the protocol advances to the next payout position.

Every participant receives the full pooled amount exactly once.

---

## 6. Default Protection

If a participant misses a payment:

- the protocol automatically deducts the missed contribution from their committed funds,
- payouts continue uninterrupted,
- remaining participants are unaffected.

No manual intervention is required.

---

## 7. Circle Completion

After all payout rounds have completed:

- committed funds are released,
- participants reclaim any remaining balance,
- the savings circle is closed.

---

# Core Features

- Permissionless savings circles
- Automatic payout scheduling
- Deterministic join-order allocation
- Collateral-backed default protection
- Transparent onchain accounting
- Trustless participation between strangers
- Fixed contribution schedules
- Multiple payment frequencies
- Fully non-custodial architecture

---

# Why Solana?

Rounds is built on Solana because it provides:

- Low transaction fees
- High throughput
- Fast settlement
- Excellent developer tooling
- A rapidly growing DeFi ecosystem

These characteristics make Solana an ideal foundation for globally accessible cooperative finance.

---

# Future Roadmap

Future protocol versions aim to introduce:

- Yield-generating committed capital
- Support for multiple collateral assets
- Tokenized Real World Assets (RWAs)
- Treasury management
- Advanced analytics
- Mobile-first experience
- Cross-circle financial products
- Additional DeFi integrations

---

# Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter

### Smart Contracts

- Rust
- Anchor Framework

### Blockchain

- Solana

---

# Running Locally

Clone the repository.

```bash
git clone https://github.com/<username>/rounds-frontend.git
```

Install dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

# Smart Contract

The frontend interacts with the Rounds Protocol Solana program.

Smart Contract Repository:

```
Coming Soon
```

Program ID:

```
Coming Soon
```

IDL:

```
Coming Soon
```

---

# Vision

Rounds aims to bring one of humanity's oldest financial coordination mechanisms into decentralized finance.

Rather than simply digitizing traditional savings circles, the protocol transforms cooperative finance into programmable infrastructure that developers, communities, and institutions can build upon.

We believe the future of DeFi is not only about making capital more productive—but also about making capital work together.

---

# Contributing

Contributions, ideas, and feedback are welcome.

If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

# License

MIT License

---

<div align="center">

**Built with ❤️ on Solana**

</div>
